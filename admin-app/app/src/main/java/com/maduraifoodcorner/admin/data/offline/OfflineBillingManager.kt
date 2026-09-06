package com.maduraifoodcorner.admin.data.offline

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.maduraifoodcorner.admin.data.model.*
import com.maduraifoodcorner.admin.data.repository.AdminRepository
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject
import javax.inject.Singleton

data class OfflineOrder(
    val localId: String = UUID.randomUUID().toString(),
    val order: Order,
    val request: CreatePosOrderRequest,
    val createdAtMillis: Long = System.currentTimeMillis()
)

data class PosCatalogCache(
    val foods: List<FoodItem> = emptyList(),
    val combos: List<Combo> = emptyList(),
    val offers: List<Offer> = emptyList(),
    val settings: RestaurantSettings? = null,
    val cachedAtMillis: Long = System.currentTimeMillis()
)

data class SyncResult(
    val totalOrders: Int,
    val successCount: Int,
    val failedCount: Int,
    val totalRevenue: Double,
    val cashRevenue: Double,
    val onlineRevenue: Double,
    val errorMessages: List<String> = emptyList()
)

@Singleton
class OfflineBillingManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val repository: AdminRepository,
    private val gson: Gson
) {
    private val prefs: SharedPreferences = context.getSharedPreferences("offline_pos_prefs", Context.MODE_PRIVATE)

    private val PREF_UNSYNCED_ORDERS = "unsynced_pos_orders"
    private val PREF_LAST_COUNTER_DATE = "last_pos_counter_date"
    private val PREF_DAILY_COUNTER = "daily_pos_counter"
    private val PREF_CATALOG_CACHE = "catalog_pos_cache"

    private val _unsyncedOrders = MutableStateFlow<List<OfflineOrder>>(emptyList())
    val unsyncedOrders: StateFlow<List<OfflineOrder>> = _unsyncedOrders.asStateFlow()

    private val _isSyncing = MutableStateFlow(false)
    val isSyncing: StateFlow<Boolean> = _isSyncing.asStateFlow()

    init {
        loadUnsyncedOrders()
    }

    private fun loadUnsyncedOrders() {
        try {
            val json = prefs.getString(PREF_UNSYNCED_ORDERS, null)
            if (!json.isNullOrBlank()) {
                val type = object : TypeToken<List<OfflineOrder>>() {}.type
                val list: List<OfflineOrder> = gson.fromJson(json, type) ?: emptyList()
                _unsyncedOrders.value = list
            } else {
                _unsyncedOrders.value = emptyList()
            }
        } catch (e: Exception) {
            _unsyncedOrders.value = emptyList()
        }
    }

    private fun saveUnsyncedOrders(list: List<OfflineOrder>) {
        _unsyncedOrders.value = list
        prefs.edit().putString(PREF_UNSYNCED_ORDERS, gson.toJson(list)).apply()
    }

    /**
     * Generates a clean sequential POS order number: e.g. "POS-001", "POS-002"
     * Counter resets automatically at midnight.
     */
    @Synchronized
    fun getNextOrderNumber(): String {
        val todayStr = SimpleDateFormat("yyyyMMdd", Locale.getDefault()).format(Date())
        val lastDate = prefs.getString(PREF_LAST_COUNTER_DATE, "")

        val currentCounter = if (lastDate == todayStr) {
            prefs.getInt(PREF_DAILY_COUNTER, 0) + 1
        } else {
            1
        }

        prefs.edit()
            .putString(PREF_LAST_COUNTER_DATE, todayStr)
            .putInt(PREF_DAILY_COUNTER, currentCounter)
            .apply()

        val displayDay = SimpleDateFormat("dd-MM", Locale.getDefault()).format(Date())
        return "MFCS-$displayDay-${String.format("%03d", currentCounter)}"
    }

    /**
     * Saves a completed POS order locally into the unsynced queue.
     * Instant operation without internet dependency.
     */
    fun saveOfflineOrder(order: Order, request: CreatePosOrderRequest): OfflineOrder {
        val offlineOrder = OfflineOrder(
            localId = UUID.randomUUID().toString(),
            order = order,
            request = request,
            createdAtMillis = System.currentTimeMillis()
        )
        val current = _unsyncedOrders.value.toMutableList()
        current.add(offlineOrder)
        saveUnsyncedOrders(current)
        return offlineOrder
    }

    /**
     * Cache catalog items & restaurant settings for 100% offline usage.
     */
    fun saveCatalogCache(foods: List<FoodItem>, combos: List<Combo>, offers: List<Offer>, settings: RestaurantSettings?) {
        val cache = PosCatalogCache(
            foods = foods,
            combos = combos,
            offers = offers,
            settings = settings,
            cachedAtMillis = System.currentTimeMillis()
        )
        prefs.edit().putString(PREF_CATALOG_CACHE, gson.toJson(cache)).apply()
    }

    fun getCachedCatalog(): PosCatalogCache? {
        return try {
            val json = prefs.getString(PREF_CATALOG_CACHE, null)
            if (!json.isNullOrBlank()) {
                gson.fromJson(json, PosCatalogCache::class.java)
            } else null
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Batch uploads all unsynced orders to the backend server.
     * Returns revenue statistics and sync details.
     */
    suspend fun syncAllOrdersToServer(
        onProgress: (current: Int, total: Int) -> Unit
    ): SyncResult = withContext(Dispatchers.IO) {
        _isSyncing.value = true
        val pending = _unsyncedOrders.value.toList()
        val total = pending.size

        if (total == 0) {
            _isSyncing.value = false
            return@withContext SyncResult(0, 0, 0, 0.0, 0.0, 0.0)
        }

        var successCount = 0
        var failedCount = 0
        var totalRevenue = 0.0
        var cashRevenue = 0.0
        var onlineRevenue = 0.0
        val errors = mutableListOf<String>()

        val remainingOrders = pending.toMutableList()

        for ((index, offlineItem) in pending.withIndex()) {
            onProgress(index + 1, total)
            val result = repository.createPosOrder(offlineItem.request)
            result.onSuccess {
                successCount++
                val amt = offlineItem.order.total_amount
                totalRevenue += amt
                if (offlineItem.order.payment_method.equals("Cash", ignoreCase = true)) {
                    cashRevenue += amt
                } else {
                    onlineRevenue += amt
                }
                // Remove successfully synced item from remaining list
                remainingOrders.removeAll { it.localId == offlineItem.localId }
                saveUnsyncedOrders(remainingOrders.toList())
            }.onFailure { err ->
                failedCount++
                errors.add("Order #${offlineItem.order.order_number}: ${err.message ?: "Sync failed"}")
            }
        }

        _isSyncing.value = false
        SyncResult(
            totalOrders = total,
            successCount = successCount,
            failedCount = failedCount,
            totalRevenue = totalRevenue,
            cashRevenue = cashRevenue,
            onlineRevenue = onlineRevenue,
            errorMessages = errors
        )
    }

    fun removeSingleOfflineOrder(localId: String) {
        val current = _unsyncedOrders.value.filterNot { it.localId == localId }
        saveUnsyncedOrders(current)
    }

    fun clearAllOfflineOrders() {
        saveUnsyncedOrders(emptyList())
    }
}
