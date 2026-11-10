package com.maduraifoodcorner.admin

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.maduraifoodcorner.admin.data.offline.AutoSyncManager
import com.maduraifoodcorner.admin.data.offline.OfflineBillingManager
import com.maduraifoodcorner.admin.ui.components.*
import com.maduraifoodcorner.admin.ui.navigation.NavGraph
import com.maduraifoodcorner.admin.ui.navigation.Screen
import com.maduraifoodcorner.admin.ui.theme.MaduraiFoodCornerAdminTheme
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var autoSyncManager: AutoSyncManager

    @Inject
    lateinit var offlineBillingManager: OfflineBillingManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaduraiFoodCornerAdminTheme {
                val navController = rememberNavController()
                val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
                val scope = rememberCoroutineScope()

                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = navBackStackEntry?.destination?.route

                // Auto-sync states
                val showAutoSyncConfirm by autoSyncManager.showConfirmationDialog.collectAsState()
                val countdownSeconds by autoSyncManager.countdownSeconds.collectAsState()
                val connectionType by autoSyncManager.connectionType.collectAsState()
                val unsyncedOrders by offlineBillingManager.unsyncedOrders.collectAsState()
                val syncProgress by autoSyncManager.syncProgress.collectAsState()
                val showResultDialog by autoSyncManager.showResultDialog.collectAsState()
                val lastSyncResult by autoSyncManager.lastSyncResult.collectAsState()

                ModalNavigationDrawer(
                    drawerState = drawerState,
                    drawerContent = {
                        AppDrawerContent(
                            currentRoute = currentRoute,
                            onNavigate = { screen ->
                                if (currentRoute != screen.route) {
                                    navController.navigate(screen.route) {
                                        popUpTo(navController.graph.startDestinationId) { saveState = true }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                            },
                            onCloseDrawer = {
                                scope.launch { drawerState.close() }
                            }
                        )
                    }
                ) {
                    Scaffold(
                        bottomBar = {
                            if (currentRoute in listOf(
                                    Screen.Dashboard.route,
                                    Screen.Orders.route,
                                    Screen.Foods.route,
                                    Screen.Reports.route,
                                    Screen.Settings.route
                                )
                            ) {
                                AppBottomBar(navController = navController)
                            }
                        }
                    ) { padding ->
                        NavGraph(
                            navController = navController,
                            onOpenDrawer = {
                                scope.launch { drawerState.open() }
                            },
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(padding)
                        )
                    }
                }

                // ─── Network Reconnected: 30s Auto-Sync Confirmation Dialog ───
                if (showAutoSyncConfirm && unsyncedOrders.isNotEmpty()) {
                    val totalAmount = unsyncedOrders.sumOf { it.order.total_amount }
                    AutoSyncConfirmationDialog(
                        pendingOrdersCount = unsyncedOrders.size,
                        pendingTotalAmount = totalAmount,
                        connectionType = connectionType,
                        countdownSeconds = countdownSeconds,
                        onConfirm = { autoSyncManager.onUserConfirmUpload() },
                        onCancel = { autoSyncManager.onUserCancelUpload() }
                    )
                }

                // ─── Auto-Sync Upload In-Progress Dialog ───
                if (syncProgress != null) {
                    val (current, total) = syncProgress!!
                    AutoSyncProgressDialog(current = current, total = total)
                }

                // ─── Upload Finished: Result Summary Dialog ───
                if (showResultDialog && lastSyncResult != null) {
                    AutoSyncResultDialog(
                        result = lastSyncResult!!,
                        onDismiss = { autoSyncManager.dismissResultDialog() }
                    )
                }
            }
        }
    }
}
