package com.maduraifoodcorner.admin.ui.screens.settings

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.maduraifoodcorner.admin.AdminApp
import com.maduraifoodcorner.admin.data.model.RestaurantSettings
import com.maduraifoodcorner.admin.data.repository.AdminRepository
import com.maduraifoodcorner.admin.utils.Constants
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class SettingsState {
    object Loading : SettingsState()
    data class Success(val settings: RestaurantSettings) : SettingsState()
    data class Error(val message: String) : SettingsState()
}

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val repository: AdminRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<SettingsState>(SettingsState.Loading)
    val uiState: StateFlow<SettingsState> = _uiState.asStateFlow()

    private val _serverIp = MutableStateFlow("")
    val serverIp: StateFlow<String> = _serverIp.asStateFlow()

    private val _dateWiseOrderingEnabled = MutableStateFlow(true)
    val dateWiseOrderingEnabled: StateFlow<Boolean> = _dateWiseOrderingEnabled.asStateFlow()

    private val _disabledDates = MutableStateFlow<Set<String>>(emptySet())
    val disabledDates: StateFlow<Set<String>> = _disabledDates.asStateFlow()

    // Order Value Offers State Tiers
    private val _orderDiscountEnabled = MutableStateFlow(false)
    val orderDiscountEnabled: StateFlow<Boolean> = _orderDiscountEnabled.asStateFlow()

    private val _tier1MinAmount = MutableStateFlow("300")
    val tier1MinAmount: StateFlow<String> = _tier1MinAmount.asStateFlow()

    private val _tier1Percentage = MutableStateFlow("5")
    val tier1Percentage: StateFlow<String> = _tier1Percentage.asStateFlow()

    private val _tier2MinAmount = MutableStateFlow("500")
    val tier2MinAmount: StateFlow<String> = _tier2MinAmount.asStateFlow()

    private val _tier2Percentage = MutableStateFlow("10")
    val tier2Percentage: StateFlow<String> = _tier2Percentage.asStateFlow()

    // Ordering Time Window Schedule
    private val _orderingScheduleEnabled = MutableStateFlow(true)
    val orderingScheduleEnabled: StateFlow<Boolean> = _orderingScheduleEnabled.asStateFlow()

    private val _orderingStartTime = MutableStateFlow("14:00")
    val orderingStartTime: StateFlow<String> = _orderingStartTime.asStateFlow()

    private val _orderingEndTime = MutableStateFlow("10:00")
    val orderingEndTime: StateFlow<String> = _orderingEndTime.asStateFlow()

    private val _orderingTimeScope = MutableStateFlow("EVERYDAY")
    val orderingTimeScope: StateFlow<String> = _orderingTimeScope.asStateFlow()

    private val _isSaving = MutableStateFlow(false)
    val isSaving: StateFlow<Boolean> = _isSaving.asStateFlow()

    private val gson = Gson()

    init {
        loadSettings()
    }

    fun loadSettings() {
        viewModelScope.launch {
            _uiState.value = SettingsState.Loading
            
            try {
                val prefs = AdminApp.instance.getSharedPreferences(Constants.PREF_NAME, Context.MODE_PRIVATE)
                _serverIp.value = prefs.getString("server_ip", "") ?: ""
            } catch (e: Exception) {
                // Ignore
            }

            val result = repository.getSettings()
            result.onSuccess { settings ->
                _uiState.value = SettingsState.Success(settings)
                _dateWiseOrderingEnabled.value = settings.date_wise_ordering_enabled
                
                _orderDiscountEnabled.value = settings.order_discount_enabled
                _tier1MinAmount.value = (settings.tier1_min_amount ?: 300.0).toInt().toString()
                _tier1Percentage.value = (settings.tier1_percentage ?: 5.0).toInt().toString()
                _tier2MinAmount.value = settings.tier2_min_amount?.toInt()?.toString() ?: ""
                _tier2Percentage.value = settings.tier2_percentage?.toInt()?.toString() ?: ""

                _orderingScheduleEnabled.value = settings.ordering_schedule_enabled
                _orderingStartTime.value = settings.ordering_start_time ?: "14:00"
                _orderingEndTime.value = settings.ordering_end_time ?: "10:00"
                _orderingTimeScope.value = settings.ordering_time_scope ?: "EVERYDAY"

                try {
                    val listType = object : TypeToken<List<String>>() {}.type
                    val parsedDates: List<String> = gson.fromJson(settings.disabled_dates ?: "[]", listType) ?: emptyList()
                    _disabledDates.value = parsedDates.toSet()
                } catch (e: Exception) {
                    _disabledDates.value = emptySet()
                }

                repository.getOrderingCalendar().onSuccess { calendarList ->
                    val closedFromDb = calendarList.filter { !it.is_open }.map { it.order_date }.toSet()
                    if (closedFromDb.isNotEmpty()) {
                        _disabledDates.value = _disabledDates.value + closedFromDb
                    }
                }.onFailure { err ->
                    android.util.Log.w("SettingsViewModel", "Failed to fetch calendar overrides from DB: ${err.message}")
                }
            }.onFailure { err ->
                _uiState.value = SettingsState.Error(err.message ?: "Failed to load restaurant settings")
            }
        }
    }

    fun setServerIp(ip: String) { _serverIp.value = ip }
    fun setDateWiseOrderingEnabled(enabled: Boolean) { _dateWiseOrderingEnabled.value = enabled }
    fun setOrderDiscountEnabled(enabled: Boolean) { _orderDiscountEnabled.value = enabled }
    fun setTier1MinAmount(valStr: String) { _tier1MinAmount.value = valStr }
    fun setTier1Percentage(valStr: String) { _tier1Percentage.value = valStr }
    fun setTier2MinAmount(valStr: String) { _tier2MinAmount.value = valStr }
    fun setTier2Percentage(valStr: String) { _tier2Percentage.value = valStr }

    fun setOrderingScheduleEnabled(enabled: Boolean) { _orderingScheduleEnabled.value = enabled }
    fun setOrderingStartTime(timeStr: String) { _orderingStartTime.value = timeStr }
    fun setOrderingEndTime(timeStr: String) { _orderingEndTime.value = timeStr }
    fun setOrderingTimeScope(scopeStr: String) { _orderingTimeScope.value = scopeStr }

    fun toggleDisabledDate(dateIsoStr: String) {
        val current = _disabledDates.value.toMutableSet()
        if (current.contains(dateIsoStr)) {
            current.remove(dateIsoStr)
        } else {
            current.add(dateIsoStr)
        }
        _disabledDates.value = current
    }

    fun saveSettings(
        currentSettings: RestaurantSettings,
        calendarDaysIso: List<String>,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            _isSaving.value = true

            try {
                val prefs = AdminApp.instance.getSharedPreferences(Constants.PREF_NAME, Context.MODE_PRIVATE)
                prefs.edit().putString("server_ip", _serverIp.value.trim()).apply()
            } catch (e: Exception) {
                // Ignore
            }

            val currentDisabled = _disabledDates.value

            val updatedSettings = currentSettings.copy(
                date_wise_ordering_enabled = _dateWiseOrderingEnabled.value,
                disabled_dates = gson.toJson(currentDisabled.toList()),
                order_discount_enabled = _orderDiscountEnabled.value,
                tier1_min_amount = _tier1MinAmount.value.toDoubleOrNull(),
                tier1_percentage = _tier1Percentage.value.toDoubleOrNull(),
                tier2_min_amount = _tier2MinAmount.value.toDoubleOrNull(),
                tier2_percentage = _tier2Percentage.value.toDoubleOrNull(),
                ordering_schedule_enabled = _orderingScheduleEnabled.value,
                ordering_start_time = _orderingStartTime.value.trim(),
                ordering_end_time = _orderingEndTime.value.trim(),
                ordering_time_scope = _orderingTimeScope.value
            )

            val settingsResult = repository.updateSettings(updatedSettings)
            if (settingsResult.isFailure) {
                _isSaving.value = false
                val err = settingsResult.exceptionOrNull()?.message ?: "Failed to update settings"
                android.util.Log.e("SettingsViewModel", "Save Settings Error: $err")
                onError(err)
                return@launch
            }

            val calendarItemsToSave = mutableListOf<com.maduraifoodcorner.admin.data.model.CalendarDateItem>()
            val allDatesToProcess = (calendarDaysIso.toSet() + currentDisabled).toList()

            for (dateIso in allDatesToProcess) {
                val isOpen = !currentDisabled.contains(dateIso)
                calendarItemsToSave.add(
                    com.maduraifoodcorner.admin.data.model.CalendarDateItem(
                        order_date = dateIso,
                        is_open = isOpen
                    )
                )
            }

            val calendarResult = repository.updateOrderingCalendar(calendarItemsToSave)
            _isSaving.value = false

            calendarResult.onSuccess {
                loadSettings()
                onSuccess()
            }.onFailure { err ->
                val msg = err.message ?: "Failed to update calendar database"
                android.util.Log.e("SettingsViewModel", "Save Calendar Error: $msg")
                onError(msg)
            }
        }
    }
}
