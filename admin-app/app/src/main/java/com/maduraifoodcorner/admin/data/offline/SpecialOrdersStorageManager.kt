package com.maduraifoodcorner.admin.data.offline

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.maduraifoodcorner.admin.data.model.SpecialOrder
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SpecialOrdersStorageManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val gson: Gson
) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("special_orders_storage_prefs", Context.MODE_PRIVATE)

    private val PREF_SPECIAL_ORDERS = "stored_special_orders"
    private val PREF_SPECIAL_DATE = "special_counter_date"
    private val PREF_SPECIAL_COUNTER = "special_daily_counter"

    private val _specialOrders = MutableStateFlow<List<SpecialOrder>>(emptyList())
    val specialOrders: StateFlow<List<SpecialOrder>> = _specialOrders.asStateFlow()

    init {
        loadStoredOrders()
    }

    private fun loadStoredOrders() {
        try {
            val json = prefs.getString(PREF_SPECIAL_ORDERS, null)
            if (!json.isNullOrBlank()) {
                val type = object : TypeToken<List<SpecialOrder>>() {}.type
                val list: List<SpecialOrder> = gson.fromJson(json, type) ?: emptyList()
                _specialOrders.value = list.sortedByDescending { it.createdAtMillis }
            } else {
                _specialOrders.value = emptyList()
            }
        } catch (e: Exception) {
            _specialOrders.value = emptyList()
        }
    }

    private fun persistOrders(list: List<SpecialOrder>) {
        val sorted = list.sortedByDescending { it.createdAtMillis }
        _specialOrders.value = sorted
        prefs.edit().putString(PREF_SPECIAL_ORDERS, gson.toJson(sorted)).apply()
    }

    /**
     * Auto generates sequential special order number: e.g. "SPO-1011-001"
     */
    @Synchronized
    fun getNextSpecialOrderNumber(): String {
        val todayStr = SimpleDateFormat("yyyyMMdd", Locale.getDefault()).format(Date())
        val lastDate = prefs.getString(PREF_SPECIAL_DATE, "")

        val currentCounter = if (lastDate == todayStr) {
            prefs.getInt(PREF_SPECIAL_COUNTER, 0) + 1
        } else {
            1
        }

        prefs.edit()
            .putString(PREF_SPECIAL_DATE, todayStr)
            .putInt(PREF_SPECIAL_COUNTER, currentCounter)
            .apply()

        val displayDay = SimpleDateFormat("ddMM", Locale.getDefault()).format(Date())
        return "SPO-$displayDay-${String.format("%03d", currentCounter)}"
    }

    /**
     * Adds or updates a special order in permanent storage.
     */
    fun saveSpecialOrder(order: SpecialOrder) {
        val current = _specialOrders.value.toMutableList()
        val index = current.indexOfFirst { it.id == order.id }
        if (index >= 0) {
            current[index] = order
        } else {
            current.add(0, order)
        }
        persistOrders(current)
    }

    fun deleteSpecialOrder(orderId: String) {
        val current = _specialOrders.value.filterNot { it.id == orderId }
        persistOrders(current)
    }

    fun getOrderById(orderId: String): SpecialOrder? {
        return _specialOrders.value.find { it.id == orderId }
    }
}

