package com.maduraifoodcorner.admin.ui.screens.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.maduraifoodcorner.admin.data.model.DashboardOverview
import com.maduraifoodcorner.admin.data.network.NetworkModule
import com.maduraifoodcorner.admin.data.repository.AdminRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class DashboardState {
    object Loading : DashboardState()
    data class Success(val data: DashboardOverview) : DashboardState()
    data class Error(val message: String) : DashboardState()
}

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val repository: AdminRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<DashboardState>(DashboardState.Loading)
    val uiState: StateFlow<DashboardState> = _uiState

    init {
        loadDashboard()
    }

    fun loadDashboard() {
        viewModelScope.launch {
            _uiState.value = DashboardState.Loading
            repository.getDashboardSummary()
                .onSuccess { overview ->
                    _uiState.value = DashboardState.Success(overview)
                }
                .onFailure { error ->
                    _uiState.value = DashboardState.Error(error.message ?: "Failed to load dashboard")
                }
        }
    }
}
