package com.maduraifoodcorner.admin.ui.screens.reports

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.maduraifoodcorner.admin.data.model.BusinessOverviewReport
import com.maduraifoodcorner.admin.data.model.FoodSaleReportItem
import com.maduraifoodcorner.admin.data.repository.AdminRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class ReportsState {
    object Loading : ReportsState()
    data class Success(val report: BusinessOverviewReport, val isTodayRevenueUnlocked: Boolean) : ReportsState()
    data class Error(val message: String) : ReportsState()
}

@HiltViewModel
class ReportsViewModel @Inject constructor(
    private val repository: AdminRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<ReportsState>(ReportsState.Loading)
    val uiState: StateFlow<ReportsState> = _uiState.asStateFlow()

    private val _foodSales = MutableStateFlow<List<FoodSaleReportItem>>(emptyList())
    val foodSales: StateFlow<List<FoodSaleReportItem>> = _foodSales.asStateFlow()

    private val _isFoodSalesLoading = MutableStateFlow(false)
    val isFoodSalesLoading: StateFlow<Boolean> = _isFoodSalesLoading.asStateFlow()

    private val _selectedFoodPreset = MutableStateFlow("all")
    val selectedFoodPreset: StateFlow<String> = _selectedFoodPreset.asStateFlow()

    private var isTodayRevenueUnlocked = false

    init {
        loadReport()
        loadFoodSales("all")
    }

    fun loadReport() {
        viewModelScope.launch {
            _uiState.value = ReportsState.Loading
            repository.getBusinessOverviewReport()
                .onSuccess { report ->
                    _uiState.value = ReportsState.Success(report, isTodayRevenueUnlocked)
                }
                .onFailure { error ->
                    _uiState.value = ReportsState.Error(error.message ?: "Failed to load reports")
                }
        }
    }

    fun loadFoodSales(preset: String) {
        _selectedFoodPreset.value = preset
        viewModelScope.launch {
            _isFoodSalesLoading.value = true
            repository.getFoodSalesReport(preset)
                .onSuccess { list ->
                    // Sort descending by quantity sold
                    _foodSales.value = list.sortedByDescending { it.quantitySold }
                    _isFoodSalesLoading.value = false
                }
                .onFailure {
                    _foodSales.value = emptyList()
                    _isFoodSalesLoading.value = false
                }
        }
    }

    fun verifyPassword(pin: String): Boolean {
        return if (pin == "2401") {
            isTodayRevenueUnlocked = true
            val current = _uiState.value
            if (current is ReportsState.Success) {
                _uiState.value = current.copy(isTodayRevenueUnlocked = true)
            }
            true
        } else {
            false
        }
    }

    fun exportReportToUri(context: android.content.Context, preset: String, uri: android.net.Uri, onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch {
            try {
                val response = repository.exportReport(preset)
                if (response.isSuccessful) {
                    val body = response.body()
                    if (body != null) {
                        try {
                            context.contentResolver.openOutputStream(uri)?.use { outputStream ->
                                body.byteStream().use { inputStream ->
                                    inputStream.copyTo(outputStream)
                                }
                            }
                            onResult(true, null)
                        } catch (e: Exception) {
                            onResult(false, e.message)
                        }
                    } else {
                        onResult(false, "Empty response body")
                    }
                } else {
                    onResult(false, "Failed to download report")
                }
            } catch (e: Exception) {
                onResult(false, e.message)
            }
        }
    }
}
