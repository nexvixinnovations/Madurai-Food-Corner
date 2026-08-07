package com.maduraifoodcorner.admin.ui.screens.billing

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.maduraifoodcorner.admin.data.model.*
import com.maduraifoodcorner.admin.data.repository.AdminRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import javax.inject.Inject

data class PosCatalogItem(
    val id: String,
    val name: String,
    val category: String,
    val itemType: String, // "food", "combo", "offer"
    val price: Double,
    val offerPrice: Double?,
    val isAvailable: Boolean = true,
    val originalFood: FoodItem? = null,
    val originalCombo: Combo? = null,
    val originalOffer: Offer? = null
) {
    val finalPrice: Double
        get() = offerPrice ?: price
}

data class CartLineItem(
    val item: PosCatalogItem,
    var quantity: Int
) {
    val unitPrice: Double
        get() = item.finalPrice

    val lineTotal: Double
        get() = unitPrice * quantity

    /** True if this item is a Special Offer (₹99 SPECIAL etc.) — excluded from percentage discount */
    val isSpecialOffer: Boolean
        get() = item.itemType == "offer"
}

sealed class BillingState {
    object Idle : BillingState()
    object Loading : BillingState()
    data class Success(
        val catalogItems: List<PosCatalogItem>,
        val categories: List<String>,
        val pendingWebsiteOrders: List<Order>
    ) : BillingState()
    data class Error(val message: String) : BillingState()
}

@HiltViewModel
class BillingViewModel @Inject constructor(
    private val repository: AdminRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<BillingState>(BillingState.Loading)
    val uiState: StateFlow<BillingState> = _uiState.asStateFlow()

    private val _cartItems = MutableStateFlow<List<CartLineItem>>(emptyList())
    val cartItems: StateFlow<List<CartLineItem>> = _cartItems.asStateFlow()

    private val _settings = MutableStateFlow<RestaurantSettings?>(null)
    val settings: StateFlow<RestaurantSettings?> = _settings.asStateFlow()

    private val _isSubmittingOrder = MutableStateFlow(false)
    val isSubmittingOrder: StateFlow<Boolean> = _isSubmittingOrder.asStateFlow()

    /**
     * Live discount breakdown computed from cart + settings.
     * Updated whenever cart or settings changes.
     */
    data class DiscountBreakdown(
        val eligibleSubtotal: Double,        // food + combo items only
        val specialOfferSubtotal: Double,    // special offer items only
        val discountPercent: Double,         // applied percentage (0 if not eligible)
        val discountAmount: Double,          // ₹ discount = eligibleSubtotal × discountPercent / 100
        val grandTotal: Double,             // (eligibleSubtotal - discountAmount) + specialOfferSubtotal
        val isDiscountEnabled: Boolean,
        val minimumAmount: Double
    )

    val discountBreakdown: StateFlow<DiscountBreakdown> = combine(_cartItems, _settings) { cart, s ->
        val eligible = cart.filter { !it.isSpecialOffer }.sumOf { it.lineTotal }
        val offerTotal = cart.filter { it.isSpecialOffer }.sumOf { it.lineTotal }

        val discountEnabled = s?.order_discount_enabled ?: false
        val minAmt = s?.tier1_min_amount ?: 0.0
        val pct = s?.tier1_percentage ?: 0.0

        val appliedPct = if (discountEnabled && pct > 0 && minAmt > 0 && eligible >= minAmt) pct else 0.0
        val discountAmt = Math.round(eligible * appliedPct / 100 * 100.0) / 100.0
        val grand = Math.max(0.0, eligible - discountAmt) + offerTotal

        DiscountBreakdown(
            eligibleSubtotal = Math.round(eligible * 100.0) / 100.0,
            specialOfferSubtotal = Math.round(offerTotal * 100.0) / 100.0,
            discountPercent = appliedPct,
            discountAmount = discountAmt,
            grandTotal = Math.round(grand * 100.0) / 100.0,
            isDiscountEnabled = discountEnabled,
            minimumAmount = minAmt
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = DiscountBreakdown(0.0, 0.0, 0.0, 0.0, 0.0, false, 0.0)
    )

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            _uiState.value = BillingState.Loading

            repository.getSettings().onSuccess { s -> _settings.value = s }

            val foodsResult = repository.getFoods()
            val combosResult = repository.getCombos()
            val offersResult = repository.getOffers()
            val ordersResult = repository.getOrders(status = "Pending")

            val allCatalogItems = mutableListOf<PosCatalogItem>()
            val categorySet = mutableSetOf<String>("All", "Combos", "Offers")

            foodsResult.onSuccess { foods ->
                foods.forEach { food ->
                    val cat = food.category.ifBlank { "General" }
                    categorySet.add(cat)
                    allCatalogItems.add(
                        PosCatalogItem(
                            id = food.id,
                            name = food.name,
                            category = cat,
                            itemType = "food",
                            price = food.price,
                            offerPrice = if (food.offer_enabled && food.offer_price != null && food.offer_price > 0) food.offer_price else null,
                            isAvailable = food.available,
                            originalFood = food
                        )
                    )
                }
            }

            combosResult.onSuccess { combos ->
                combos.forEach { combo ->
                    allCatalogItems.add(
                        PosCatalogItem(
                            id = combo.id,
                            name = combo.name,
                            category = "Combos",
                            itemType = "combo",
                            price = combo.price,
                            offerPrice = if (combo.offer_enabled && combo.offer_price != null && combo.offer_price > 0) combo.offer_price else null,
                            isAvailable = combo.available,
                            originalCombo = combo
                        )
                    )
                }
            }

            offersResult.onSuccess { offers ->
                offers.forEach { offer ->
                    allCatalogItems.add(
                        PosCatalogItem(
                            id = offer.id,
                            name = offer.title,
                            category = "Offers",
                            itemType = "offer",
                            price = offer.price ?: offer.offer_price ?: 0.0,
                            offerPrice = offer.offer_price,
                            isAvailable = offer.available,
                            originalOffer = offer
                        )
                    )
                }
            }

            val pendingOrders = ordersResult.getOrDefault(emptyList())

            if (allCatalogItems.isNotEmpty()) {
                _uiState.value = BillingState.Success(
                    catalogItems = allCatalogItems,
                    categories = categorySet.toList(),
                    pendingWebsiteOrders = pendingOrders
                )
            } else {
                _uiState.value = BillingState.Error("Failed to load catalog items for POS billing")
            }
        }
    }

    fun addItemToCart(catalogItem: PosCatalogItem) {
        val current = _cartItems.value.toMutableList()
        val index = current.indexOfFirst { it.item.id == catalogItem.id && it.item.itemType == catalogItem.itemType }
        if (index >= 0) {
            val existing = current[index]
            current[index] = existing.copy(quantity = existing.quantity + 1)
        } else {
            current.add(CartLineItem(item = catalogItem, quantity = 1))
        }
        _cartItems.value = current
    }

    fun incrementQuantity(itemId: String) {
        val current = _cartItems.value.toMutableList()
        val index = current.indexOfFirst { it.item.id == itemId }
        if (index >= 0) {
            val existing = current[index]
            current[index] = existing.copy(quantity = existing.quantity + 1)
        }
        _cartItems.value = current
    }

    fun decrementQuantity(itemId: String) {
        val current = _cartItems.value.toMutableList()
        val index = current.indexOfFirst { it.item.id == itemId }
        if (index >= 0) {
            val existing = current[index]
            if (existing.quantity > 1) {
                current[index] = existing.copy(quantity = existing.quantity - 1)
            } else {
                current.removeAt(index)
            }
        }
        _cartItems.value = current
    }

    fun removeItem(itemId: String) {
        val current = _cartItems.value.filterNot { it.item.id == itemId }
        _cartItems.value = current
    }

    fun clearCart() {
        _cartItems.value = emptyList()
    }

    fun generatePosOrder(
        orderType: String = "Parcel",
        paymentMethod: String = "Cash",
        customerName: String = "",
        customerPhone: String = "",
        onSuccess: (Order) -> Unit,
        onError: (String) -> Unit
    ) {
        val cart = _cartItems.value
        if (cart.isEmpty()) {
            onError("Cart is empty!")
            return
        }

        viewModelScope.launch {
            _isSubmittingOrder.value = true
            val todayStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
            val timeStr = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())

            val itemRequests = cart.map { lineItem ->
                CreateOrderItemRequest(
                    type = lineItem.item.itemType,
                    id = lineItem.item.id,
                    quantity = lineItem.quantity,
                    unit_price = lineItem.unitPrice
                )
            }

            val posOrderReq = CreatePosOrderRequest(
                customer = CreateCustomerRequest(
                    name = customerName,
                    phone = customerPhone
                ),
                required_date = todayStr,
                required_time = timeStr,
                order_type = orderType,
                payment_method = paymentMethod,
                payment_status = "Completed",
                status = "Completed",
                order_source = "POS Counter",
                items = itemRequests
            )

            val result = repository.createPosOrder(posOrderReq)
            _isSubmittingOrder.value = false

            result.onSuccess { createdOrder ->
                clearCart()
                loadData()
                onSuccess(createdOrder)
            }.onFailure { err ->
                onError(err.message ?: "Failed to generate POS order")
            }
        }
    }

    fun loadWebsiteOrderToCart(order: Order) {
        val state = _uiState.value
        if (state is BillingState.Success) {
            val loadedCart = mutableListOf<CartLineItem>()
            order.order_items.forEach { item ->
                val matchingCatalog = state.catalogItems.find { 
                    it.id == (item.food_item_id ?: item.combo_id) 
                }
                if (matchingCatalog != null) {
                    loadedCart.add(CartLineItem(item = matchingCatalog, quantity = item.quantity))
                }
            }
            _cartItems.value = loadedCart
        }
    }
}
