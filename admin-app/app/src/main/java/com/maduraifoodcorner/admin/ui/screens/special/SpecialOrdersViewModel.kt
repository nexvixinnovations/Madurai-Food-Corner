package com.maduraifoodcorner.admin.ui.screens.special

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.maduraifoodcorner.admin.data.model.*
import com.maduraifoodcorner.admin.data.offline.SpecialOrdersStorageManager
import com.maduraifoodcorner.admin.data.repository.AdminRepository
import com.maduraifoodcorner.admin.utils.SpecialOrderPdfGenerator
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.io.File
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject

@HiltViewModel
class SpecialOrdersViewModel @Inject constructor(
    private val storageManager: SpecialOrdersStorageManager,
    private val repository: AdminRepository,
    private val pdfGenerator: SpecialOrderPdfGenerator
) : ViewModel() {

    // Customer & Order Header details
    private val _customerName = MutableStateFlow("")
    val customerName: StateFlow<String> = _customerName.asStateFlow()

    private val _customerPhone = MutableStateFlow("")
    val customerPhone: StateFlow<String> = _customerPhone.asStateFlow()

    private val _orderNumber = MutableStateFlow("")
    val orderNumber: StateFlow<String> = _orderNumber.asStateFlow()

    private val _eventDate = MutableStateFlow("")
    val eventDate: StateFlow<String> = _eventDate.asStateFlow()

    private val _advancePaidText = MutableStateFlow("")
    val advancePaidText: StateFlow<String> = _advancePaidText.asStateFlow()

    // Bulk Items list
    private val _selectedItems = MutableStateFlow<List<SpecialOrderItem>>(emptyList())
    val selectedItems: StateFlow<List<SpecialOrderItem>> = _selectedItems.asStateFlow()

    // Available Catalog foods for picking
    private val _availableFoods = MutableStateFlow<List<FoodItem>>(emptyList())
    val availableFoods: StateFlow<List<FoodItem>> = _availableFoods.asStateFlow()

    // Persistent Stored Orders
    val storedOrders: StateFlow<List<SpecialOrder>> = storageManager.specialOrders

    private val _isGeneratingPdf = MutableStateFlow(false)
    val isGeneratingPdf: StateFlow<Boolean> = _isGeneratingPdf.asStateFlow()

    init {
        generateNewOrderNumber()
        loadAvailableFoods()
    }

    fun generateNewOrderNumber() {
        _orderNumber.value = storageManager.getNextSpecialOrderNumber()
    }

    fun setCustomerName(name: String) {
        _customerName.value = name
    }

    fun setCustomerPhone(phone: String) {
        _customerPhone.value = phone
    }

    fun setEventDate(date: String) {
        _eventDate.value = date
    }

    fun setAdvancePaid(amount: String) {
        _advancePaidText.value = amount
    }

    private fun loadAvailableFoods() {
        viewModelScope.launch {
            repository.getFoods().onSuccess { foods ->
                _availableFoods.value = foods.filter { it.available }
            }
        }
    }

    fun addFoodItem(food: FoodItem, defaultQty: Int = 10) {
        val current = _selectedItems.value.toMutableList()
        val existingIndex = current.indexOfFirst { it.foodId == food.id }
        if (existingIndex >= 0) {
            val existing = current[existingIndex]
            current[existingIndex] = existing.copy(quantity = existing.quantity + defaultQty)
        } else {
            current.add(
                SpecialOrderItem(
                    id = UUID.randomUUID().toString(),
                    foodId = food.id,
                    foodName = food.name,
                    category = food.category.ifBlank { "Special Food" },
                    quantity = defaultQty,
                    unitPrice = food.price, // Default to standard menu price
                    standardPrice = food.price
                )
            )
        }
        _selectedItems.value = current
    }

    fun addCustomCateringItem(name: String, quantity: Int, unitPrice: Double) {
        if (name.isBlank() || quantity <= 0) return
        val current = _selectedItems.value.toMutableList()
        current.add(
            SpecialOrderItem(
                id = UUID.randomUUID().toString(),
                foodId = null,
                foodName = name.trim(),
                category = "Catering Special",
                quantity = quantity,
                unitPrice = unitPrice,
                standardPrice = unitPrice
            )
        )
        _selectedItems.value = current
    }

    /**
     * Updates the custom price of a bulk food item.
     */
    fun updateItemPrice(itemId: String, newPrice: Double) {
        val current = _selectedItems.value.toMutableList()
        val index = current.indexOfFirst { it.id == itemId }
        if (index >= 0) {
            current[index] = current[index].copy(unitPrice = Math.max(0.0, newPrice))
            _selectedItems.value = current
        }
    }

    /**
     * Updates the bulk quantity of a food item.
     */
    fun updateItemQuantity(itemId: String, newQuantity: Int) {
        val current = _selectedItems.value.toMutableList()
        val index = current.indexOfFirst { it.id == itemId }
        if (index >= 0) {
            if (newQuantity <= 0) {
                current.removeAt(index)
            } else {
                current[index] = current[index].copy(quantity = newQuantity)
            }
            _selectedItems.value = current
        }
    }

    fun removeItem(itemId: String) {
        _selectedItems.value = _selectedItems.value.filterNot { it.id == itemId }
    }

    fun clearForm() {
        _customerName.value = ""
        _customerPhone.value = ""
        _eventDate.value = ""
        _advancePaidText.value = ""
        _selectedItems.value = emptyList()
        generateNewOrderNumber()
    }

    fun saveSpecialOrderAndCreatePdf(
        onSuccess: (SpecialOrder, File) -> Unit,
        onError: (String) -> Unit
    ) {
        val name = _customerName.value.trim()
        val phone = _customerPhone.value.trim()
        val items = _selectedItems.value

        if (name.isBlank()) {
            onError("Please enter customer name")
            return
        }
        if (phone.isBlank()) {
            onError("Please enter customer phone number")
            return
        }
        if (items.isEmpty()) {
            onError("Please add at least one food item for the special order")
            return
        }

        viewModelScope.launch {
            try {
                _isGeneratingPdf.value = true

                val subtotal = items.sumOf { it.lineTotal }
                val totalAmount = subtotal
                val advance = _advancePaidText.value.toDoubleOrNull() ?: 0.0
                val balance = (totalAmount - advance).coerceAtLeast(0.0)
                val paymentStatus = when {
                    balance <= 0.0 -> "Fully Paid"
                    advance > 0.0 -> "Partially Paid"
                    else -> "Pending"
                }

                val nowFormatted = SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.getDefault()).format(Date())

                var order = SpecialOrder(
                    id = UUID.randomUUID().toString(),
                    orderNumber = _orderNumber.value.ifBlank { storageManager.getNextSpecialOrderNumber() },
                    customerName = name,
                    customerPhone = phone,
                    eventDate = _eventDate.value.ifBlank { SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()) },
                    items = items,
                    subtotal = subtotal,
                    totalAmount = totalAmount,
                    advancePaid = advance,
                    balanceAmount = balance,
                    paymentStatus = paymentStatus,
                    createdAtMillis = System.currentTimeMillis(),
                    createdAtFormatted = nowFormatted
                )

                // Generate PDF Invoice
                val pdfFile = pdfGenerator.generateInvoicePdf(order)
                order = order.copy(pdfFilePath = pdfFile.absolutePath)

                // Save to local persistent storage
                storageManager.saveSpecialOrder(order)

                // Also try syncing to backend server asynchronously
                try {
                    val posReq = CreatePosOrderRequest(
                        customer = CreateCustomerRequest(name = name, phone = phone),
                        required_date = order.eventDate,
                        required_time = "12:00 PM",
                        order_type = "Special Bulk",
                        payment_method = "Cash",
                        payment_status = if (balance <= 0) "Completed" else "Pending",
                        status = "Accepted",
                        order_source = "Special Order",
                        items = items.map { line ->
                            CreateOrderItemRequest(
                                type = "food",
                                id = line.foodId ?: "custom",
                                quantity = line.quantity,
                                unit_price = line.unitPrice
                            )
                        }
                    )
                    repository.createPosOrder(posReq)
                } catch (ignored: Exception) {}

                _isGeneratingPdf.value = false
                clearForm()
                onSuccess(order, pdfFile)
            } catch (e: Exception) {
                _isGeneratingPdf.value = false
                onError(e.message ?: "Failed to save special order and generate PDF")
            }
        }
    }

    fun deleteStoredOrder(orderId: String) {
        storageManager.deleteSpecialOrder(orderId)
    }

    fun openPdf(context: Context, order: SpecialOrder) {
        val file = if (!order.pdfFilePath.isNullOrBlank()) {
            val f = File(order.pdfFilePath)
            if (f.exists()) f else pdfGenerator.generateInvoicePdf(order)
        } else {
            pdfGenerator.generateInvoicePdf(order)
        }
        pdfGenerator.openPdf(context, file)
    }

    fun sharePdf(context: Context, order: SpecialOrder) {
        val file = if (!order.pdfFilePath.isNullOrBlank()) {
            val f = File(order.pdfFilePath)
            if (f.exists()) f else pdfGenerator.generateInvoicePdf(order)
        } else {
            pdfGenerator.generateInvoicePdf(order)
        }
        pdfGenerator.sharePdf(context, file, order.customerName)
    }
}

