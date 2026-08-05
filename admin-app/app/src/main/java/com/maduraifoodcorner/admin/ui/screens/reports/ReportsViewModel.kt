package com.maduraifoodcorner.admin.ui.screens.reports

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.maduraifoodcorner.admin.data.model.BusinessOverviewReport
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

    private var isTodayRevenueUnlocked = false

    init {
        loadReport()
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
}
