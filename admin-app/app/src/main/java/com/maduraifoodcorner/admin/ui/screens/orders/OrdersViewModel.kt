package com.maduraifoodcorner.admin.ui.screens.orders

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.maduraifoodcorner.admin.data.model.Order
import com.maduraifoodcorner.admin.data.repository.AdminRepository
import com.maduraifoodcorner.admin.data.repository.PrintRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class OrdersState {
    object Loading : OrdersState()
    data class Success(val orders: List<Order>) : OrdersState()
    data class Error(val message: String) : OrdersState()
}

@HiltViewModel
class OrdersViewModel @Inject constructor(
    private val repository: AdminRepository,
    private val printRepository: PrintRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<OrdersState>(OrdersState.Loading)
    val uiState: StateFlow<OrdersState> = _uiState

    private val _printStatus = MutableStateFlow<String?>(null)
    val printStatus: StateFlow<String?> = _printStatus
    
    private val _settings = MutableStateFlow<com.maduraifoodcorner.admin.data.model.RestaurantSettings?>(null)
    val settings: StateFlow<com.maduraifoodcorner.admin.data.model.RestaurantSettings?> = _settings

    init {
        loadOrders()
    }

    fun loadOrders(status: String? = null) {
        viewModelScope.launch {
            _uiState.value = OrdersState.Loading
            repository.getSettings().onSuccess { s -> _settings.value = s }
            repository.getOrders(status)
                .onSuccess { orders ->
                    _uiState.value = OrdersState.Success(orders)
                }
                .onFailure { error ->
                    _uiState.value = OrdersState.Error(error.message ?: "Failed to load orders")
                }
        }
    }

    fun updateStatus(orderId: String, newStatus: String) {
        viewModelScope.launch {
            repository.updateOrderStatus(orderId, newStatus)
                .onSuccess {
                    loadOrders()
                }
        }
    }

    fun printBill(context: Context, order: Order) {
        viewModelScope.launch {
            val success = printRepository.printOrderReceipt(order)
            _printStatus.value = if (success) "Receipt printed!" else "Printer connection failed"
        }
    }

    fun getOrderDetails(orderId: String, onResult: (Order?) -> Unit) {
        viewModelScope.launch {
            repository.getOrderById(orderId)
                .onSuccess { order -> onResult(order) }
                .onFailure { onResult(null) }
        }
    }
}
