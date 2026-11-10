package com.maduraifoodcorner.admin.data.offline

import com.maduraifoodcorner.admin.utils.NetworkMonitor
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AutoSyncManager @Inject constructor(
    private val offlineBillingManager: OfflineBillingManager,
    private val networkMonitor: NetworkMonitor
) {
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    private val _isOnline = MutableStateFlow(false)
    val isOnline: StateFlow<Boolean> = _isOnline.asStateFlow()

    private val _connectionType = MutableStateFlow("Checking...")
    val connectionType: StateFlow<String> = _connectionType.asStateFlow()

    private val _showConfirmationDialog = MutableStateFlow(false)
    val showConfirmationDialog: StateFlow<Boolean> = _showConfirmationDialog.asStateFlow()

    private val _countdownSeconds = MutableStateFlow(30)
    val countdownSeconds: StateFlow<Int> = _countdownSeconds.asStateFlow()

    private val _syncProgress = MutableStateFlow<Pair<Int, Int>?>(null)
    val syncProgress: StateFlow<Pair<Int, Int>?> = _syncProgress.asStateFlow()

    private val _lastSyncResult = MutableStateFlow<SyncResult?>(null)
    val lastSyncResult: StateFlow<SyncResult?> = _lastSyncResult.asStateFlow()

    private val _showResultDialog = MutableStateFlow(false)
    val showResultDialog: StateFlow<Boolean> = _showResultDialog.asStateFlow()

    private var countdownJob: Job? = null
    private var lastDismissedOrdersCount: Int = -1

    init {
        monitorNetworkAndOrders()
    }

    private fun monitorNetworkAndOrders() {
        scope.launch {
            networkMonitor.isConnected.collect { online ->
                _isOnline.value = online
                _connectionType.value = networkMonitor.getConnectionType()

                if (online) {
                    val pending = offlineBillingManager.unsyncedOrders.value
                    if (pending.isNotEmpty() && !offlineBillingManager.isSyncing.value) {
                        // Only trigger if not already showing, not syncing, and not recently cancelled for same count
                        if (!_showConfirmationDialog.value && !_showResultDialog.value && pending.size != lastDismissedOrdersCount) {
                            startConfirmationCountdown()
                        }
                    }
                } else {
                    // Network lost -> stop countdown if active, wait for reconnection
                    cancelCountdown(resetDismissed = false)
                }
            }
        }

        // Also watch unsynced orders list
        scope.launch {
            offlineBillingManager.unsyncedOrders.collect { pending ->
                if (pending.isEmpty()) {
                    cancelCountdown(resetDismissed = true)
                    lastDismissedOrdersCount = -1
                } else if (_isOnline.value && !_showConfirmationDialog.value && !_showResultDialog.value && !offlineBillingManager.isSyncing.value) {
                    if (pending.size != lastDismissedOrdersCount) {
                        startConfirmationCountdown()
                    }
                }
            }
        }
    }

    /**
     * Starts the 30-second countdown before automatically syncing.
     */
    fun startConfirmationCountdown() {
        countdownJob?.cancel()
        _countdownSeconds.value = 30
        _showConfirmationDialog.value = true

        countdownJob = scope.launch {
            for (i in 30 downTo 1) {
                _countdownSeconds.value = i
                delay(1000L)
            }
            _countdownSeconds.value = 0
            _showConfirmationDialog.value = false
            // Timer expired without user action: automatically upload the bills!
            executeUpload()
        }
    }

    /**
     * User action: "Upload Now" confirmed by user.
     */
    fun onUserConfirmUpload() {
        countdownJob?.cancel()
        _showConfirmationDialog.value = false
        executeUpload()
    }

    /**
     * User action: "Cancel / Later" when confirmation is asked.
     */
    fun onUserCancelUpload() {
        countdownJob?.cancel()
        _showConfirmationDialog.value = false
        lastDismissedOrdersCount = offlineBillingManager.unsyncedOrders.value.size
    }

    private fun cancelCountdown(resetDismissed: Boolean) {
        countdownJob?.cancel()
        _showConfirmationDialog.value = false
        if (resetDismissed) {
            lastDismissedOrdersCount = -1
        }
    }

    /**
     * Uploads the offline bills and shows result dialog.
     */
    fun executeUpload() {
        scope.launch {
            if (!_isOnline.value) {
                return@launch
            }
            val result = offlineBillingManager.syncAllOrdersToServer { current, total ->
                _syncProgress.value = Pair(current, total)
            }
            _syncProgress.value = null
            _lastSyncResult.value = result
            _showResultDialog.value = true
            lastDismissedOrdersCount = -1
        }
    }

    fun dismissResultDialog() {
        _showResultDialog.value = false
    }
}

