package com.maduraifoodcorner.admin.ui.screens.billing

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.maduraifoodcorner.admin.data.model.*
import com.maduraifoodcorner.admin.data.offline.OfflineBillingManager
import com.maduraifoodcorner.admin.data.offline.OfflineOrder
import com.maduraifoodcorner.admin.data.offline.SyncResult
import com.maduraifoodcorner.admin.data.repository.AdminRepository
import com.maduraifoodcorner.admin.data.repository.PrintRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID
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
        val pendingWebsiteOrders: List<Order>,
        val isOffline: Boolean = false
    ) : BillingState()
    data class Error(val message: String) : BillingState()
}

@HiltViewModel
class BillingViewModel @Inject constructor(
    private val repository: AdminRepository,
    private val offlineBillingManager: OfflineBillingManager,
    private val printRepository: PrintRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<BillingState>(BillingState.Loading)
    val uiState: StateFlow<BillingState> = _uiState.asStateFlow()

    private val _cartItems = MutableStateFlow<List<CartLineItem>>(emptyList())
    val cartItems: StateFlow<List<CartLineItem>> = _cartItems.asStateFlow()

    private val _settings = MutableStateFlow<RestaurantSettings?>(null)
    val settings: StateFlow<RestaurantSettings?> = _settings.asStateFlow()

    val unsyncedOrders: StateFlow<List<OfflineOrder>> = offlineBillingManager.unsyncedOrders
    val isSyncing: StateFlow<Boolean> = offlineBillingManager.isSyncing

    private val _syncProgress = MutableStateFlow<Pair<Int, Int>?>(null)
    val syncProgress: StateFlow<Pair<Int, Int>?> = _syncProgress.asStateFlow()

    private val _lastSyncResult = MutableStateFlow<SyncResult?>(null)
    val lastSyncResult: StateFlow<SyncResult?> = _lastSyncResult.asStateFlow()

    private val _showRevenueDialog = MutableStateFlow(false)
    val showRevenueDialog: StateFlow<Boolean> = _showRevenueDialog.asStateFlow()

    private val _isOfflineMode = MutableStateFlow(false)
    val isOfflineMode: StateFlow<Boolean> = _isOfflineMode.asStateFlow()

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

            try {
                val settingsResult = repository.getSettings()
                settingsResult.onSuccess { s -> _settings.value = s }

                val foodsResult = repository.getFoods()
                val combosResult = repository.getCombos()
                val offersResult = repository.getOffers()
                val ordersResult = repository.getOrders(status = "Pending")

                if (foodsResult.isSuccess || combosResult.isSuccess || offersResult.isSuccess) {
                    val foods = foodsResult.getOrDefault(emptyList())
                    val combos = combosResult.getOrDefault(emptyList())
                    val offers = offersResult.getOrDefault(emptyList())
                    val pendingOrders = ordersResult.getOrDefault(emptyList())

                    // Cache for future offline usage
                    offlineBillingManager.saveCatalogCache(foods, combos, offers, _settings.value)
                    _isOfflineMode.value = false

                    val catalogItems = buildCatalogItems(foods, combos, offers)
                    val categories = buildCategories(foods)

                    _uiState.value = BillingState.Success(
                        catalogItems = catalogItems,
                        categories = categories,
                        pendingWebsiteOrders = pendingOrders,
                        isOffline = false
                    )
                    return@launch
                }
            } catch (e: Exception) {
                // Ignore network error and fall back to local offline cache
            }

            // Fallback to local offline cached catalog
            val cache = offlineBillingManager.getCachedCatalog()
            if (cache != null && (cache.foods.isNotEmpty() || cache.combos.isNotEmpty() || cache.offers.isNotEmpty())) {
                _settings.value = cache.settings
                _isOfflineMode.value = true
                val catalogItems = buildCatalogItems(cache.foods, cache.combos, cache.offers)
                val categories = buildCategories(cache.foods)

                _uiState.value = BillingState.Success(
                    catalogItems = catalogItems,
                    categories = categories,
                    pendingWebsiteOrders = emptyList(),
                    isOffline = true
                )
            } else {
                _uiState.value = BillingState.Error("No catalog data available. Please connect to internet once to load items.")
            }
        }
    }

    private fun buildCatalogItems(foods: List<FoodItem>, combos: List<Combo>, offers: List<Offer>): List<PosCatalogItem> {
        val allCatalogItems = mutableListOf<PosCatalogItem>()

        foods.forEach { food ->
            val cat = food.category.ifBlank { "General" }
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

        return allCatalogItems
    }

    private fun buildCategories(foods: List<FoodItem>): List<String> {
        val categorySet = mutableSetOf("All", "Combos", "Offers")
        foods.forEach { food ->
            val cat = food.category.ifBlank { "General" }
            categorySet.add(cat)
        }
        return categorySet.toList()
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

    /**
     * Completes order INSTANTLY without waiting for the internet.
     * 1. Generates local sequential order & calculated totals.
     * 2. Queues into offline storage.
     * 3. Triggers printer asynchronously via Singleton PrintRepository.
     * 4. Clears cart immediately for next customer.
     */
    fun completePosOrderOffline(
        orderType: String = "Shop",
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

        try {
            val breakdown = discountBreakdown.value
            val todayDate = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
            val timeStr = SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Date())
            val orderNumber = offlineBillingManager.getNextOrderNumber()

            val orderItems = cart.map { line ->
                OrderItem(
                    id = UUID.randomUUID().toString(),
                    food_item_id = if (line.item.itemType == "food") line.item.id else null,
                    combo_id = if (line.item.itemType == "combo") line.item.id else null,
                    quantity = line.quantity,
                    unit_price = line.unitPrice,
                    line_total = line.lineTotal,
                    food_items = line.item.originalFood ?: FoodItem(id = line.item.id, name = line.item.name, price = line.unitPrice),
                    combos = line.item.originalCombo
                )
            }

            val rawSubtotal = breakdown.eligibleSubtotal + breakdown.specialOfferSubtotal

            val localOrder = Order(
                id = UUID.randomUUID().toString(),
                order_number = orderNumber,
                order_source = "POS Counter",
                required_date = todayDate,
                required_time = timeStr,
                order_type = orderType,
                payment_method = paymentMethod,
                payment_status = "Completed",
                status = "Completed",
                subtotal = rawSubtotal,
                discount_percentage = if (breakdown.discountPercent > 0) breakdown.discountPercent else null,
                discount_amount = if (breakdown.discountAmount > 0) breakdown.discountAmount else null,
                total_amount = breakdown.grandTotal,
                customers = Customer(
                    name = if (customerName.isNotBlank()) customerName.trim() else "Walk-in Customer",
                    phone = if (customerPhone.isNotBlank()) customerPhone.trim() else "0000000000"
                ),
                order_items = orderItems
            )

            val itemRequests = cart.map { line ->
                CreateOrderItemRequest(
                    type = line.item.itemType,
                    id = line.item.id,
                    quantity = line.quantity,
                    unit_price = line.unitPrice
                )
            }

            val posOrderReq = CreatePosOrderRequest(
                customer = CreateCustomerRequest(
                    name = if (customerName.isNotBlank()) customerName.trim() else "Walk-in Customer",
                    phone = if (customerPhone.isNotBlank()) customerPhone.trim() else "0000000000"
                ),
                required_date = todayDate,
                required_time = timeStr,
                order_type = orderType,
                payment_method = paymentMethod,
                payment_status = "Completed",
                status = "Completed",
                order_source = "POS Counter",
                items = itemRequests
            )

            // Save to offline persistent queue
            offlineBillingManager.saveOfflineOrder(localOrder, posOrderReq)

            // Trigger thermal printer print asynchronously
            viewModelScope.launch {
                try {
                    printRepository.printOrderReceipt(localOrder)
                } catch (ignored: Exception) {}
            }

            // Clear cart instantly
            clearCart()

            onSuccess(localOrder)
        } catch (e: Exception) {
            onError(e.message ?: "Failed to complete POS order")
        }
    }

    /**
     * Batch uploads all offline queued orders to the data server.
     */
    fun syncAllOrdersToServer(onComplete: (SyncResult) -> Unit = {}) {
        viewModelScope.launch {
            val result = offlineBillingManager.syncAllOrdersToServer { current, total ->
                _syncProgress.value = Pair(current, total)
            }
            _syncProgress.value = null
            _lastSyncResult.value = result
            _showRevenueDialog.value = true
            onComplete(result)
        }
    }

    fun dismissRevenueDialog() {
        _showRevenueDialog.value = false
    }

    fun deleteOfflineOrder(localId: String) {
        offlineBillingManager.removeSingleOfflineOrder(localId)
    }

    fun reprintOrder(order: Order, onResult: (Boolean) -> Unit = {}) {
        viewModelScope.launch {
            try {
                val ok = printRepository.printOrderReceipt(order)
                onResult(ok)
            } catch (e: Exception) {
                onResult(false)
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
