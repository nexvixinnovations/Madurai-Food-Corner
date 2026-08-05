package com.maduraifoodcorner.admin.ui.screens.dashboard

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.hilt.navigation.compose.hiltViewModel
import com.maduraifoodcorner.admin.ui.components.LoadingState
import com.maduraifoodcorner.admin.ui.components.OrderStatusBadge
import com.maduraifoodcorner.admin.ui.components.StatCard

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onOpenDrawer: () -> Unit,
    onNavigateToOrders: () -> Unit,
    onNavigateToFoods: () -> Unit,
    viewModel: DashboardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var isRevenueUnlocked by remember { mutableStateOf(false) }
    var showPinDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "MADURAI FOOD CORNER",
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                        Text(
                            text = "Real-time Admin Dashboard",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onOpenDrawer) {
                        Icon(Icons.Default.Menu, contentDescription = "Open Drawer")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.loadDashboard() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        }
    ) { padding ->
        Box(modifier = Modifier.padding(padding)) {
            when (val state = uiState) {
                is DashboardState.Loading -> LoadingState("Fetching real-time business data...")
                is DashboardState.Error -> {
                    var showServerIpDialog by remember { mutableStateOf(false) }
                    val context = LocalContext.current

                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.padding(24.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.WifiOff,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.error,
                                modifier = Modifier.size(48.dp)
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = state.message,
                                color = MaterialTheme.colorScheme.error,
                                textAlign = TextAlign.Center,
                                fontSize = 14.sp
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                Button(onClick = { viewModel.loadDashboard() }) {
                                    Text("Retry")
                                }
                                OutlinedButton(onClick = { showServerIpDialog = true }) {
                                    Text("Change Server IP")
                                }
                            }
                        }
                    }

                    if (showServerIpDialog) {
                        val prefs = remember { context.getSharedPreferences(com.maduraifoodcorner.admin.utils.Constants.PREF_NAME, android.content.Context.MODE_PRIVATE) }
                        var tempIp by remember { mutableStateOf(prefs.getString("server_ip", "10.201.50.49:5000") ?: "10.201.50.49:5000") }

                        AlertDialog(
                            onDismissRequest = { showServerIpDialog = false },
                            title = { Text("Configure Backend Host IP", fontWeight = FontWeight.Bold) },
                            text = {
                                Column {
                                    Text("Enter your PC's IP address (e.g. 10.201.50.49:5000 or 192.168.1.X:5000):", fontSize = 12.sp, color = Color.Gray)
                                    Spacer(modifier = Modifier.height(8.dp))
                                    OutlinedTextField(
                                        value = tempIp,
                                        onValueChange = { tempIp = it },
                                        singleLine = true,
                                        modifier = Modifier.fillMaxWidth()
                                    )
                                }
                            },
                            confirmButton = {
                                Button(
                                    onClick = {
                                        prefs.edit().putString("server_ip", tempIp.trim()).apply()
                                        showServerIpDialog = false
                                        viewModel.loadDashboard()
                                    }
                                ) {
                                    Text("Save & Connect")
                                }
                            },
                            dismissButton = {
                                TextButton(onClick = { showServerIpDialog = false }) {
                                    Text("Cancel")
                                }
                            }
                        )
                    }
                }
                is DashboardState.Success -> {
                    val data = state.data
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Revenue & Orders Quick Stats Grid (Protected)
                        item {
                            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                Card(
                                    shape = RoundedCornerShape(16.dp),
                                    colors = CardDefaults.cardColors(containerColor = Color(0xFFE8F5E9)),
                                    modifier = Modifier
                                        .weight(1f)
                                        .clickable {
                                            if (!isRevenueUnlocked) showPinDialog = true
                                        }
                                ) {
                                    Column(modifier = Modifier.padding(16.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text(text = "Today's Revenue", fontSize = 12.sp, color = Color.DarkGray)
                                            Icon(
                                                imageVector = if (isRevenueUnlocked) Icons.Default.LockOpen else Icons.Default.Lock,
                                                contentDescription = "Security Status",
                                                tint = if (isRevenueUnlocked) Color(0xFF2E7D32) else Color(0xFFC62828),
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Text(
                                            text = if (isRevenueUnlocked) "₹${data.total_sales.toInt()}" else "₹ ••••",
                                            fontWeight = FontWeight.ExtraBold,
                                            fontSize = 20.sp,
                                            color = Color(0xFF2E7D32)
                                        )
                                    }
                                }

                                StatCard(
                                    title = "Total Orders",
                                    value = "${data.total_orders}",
                                    icon = Icons.Default.ShoppingBag,
                                    iconColor = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }

                        // Quick Action Buttons
                        item {
                            Card(
                                shape = RoundedCornerShape(20.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                elevation = CardDefaults.cardElevation(2.dp)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(
                                        text = "Quick Actions",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 16.sp
                                    )
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Button(
                                            onClick = onNavigateToOrders,
                                            modifier = Modifier.weight(1f),
                                            shape = RoundedCornerShape(12.dp)
                                        ) {
                                            Icon(Icons.Default.ListAlt, contentDescription = null)
                                            Spacer(Modifier.width(4.dp))
                                            Text("Orders")
                                        }
                                        OutlinedButton(
                                            onClick = onNavigateToFoods,
                                            modifier = Modifier.weight(1f),
                                            shape = RoundedCornerShape(12.dp)
                                        ) {
                                            Icon(Icons.Default.Add, contentDescription = null)
                                            Spacer(Modifier.width(4.dp))
                                            Text("Add Food")
                                        }
                                    }
                                }
                            }
                        }

                        // Recent Orders List Header
                        item {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Recent Orders",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 18.sp
                                )
                                TextButton(onClick = onNavigateToOrders) {
                                    Text("View All")
                                }
                            }
                        }

                        // Recent Orders List Items
                        if (data.recent_orders.isEmpty()) {
                            item {
                                Text(
                                    text = "No recent orders recorded today.",
                                    color = Color.Gray,
                                    fontSize = 13.sp
                                )
                            }
                        } else {
                            items(data.recent_orders.take(5)) { order ->
                                Card(
                                    shape = RoundedCornerShape(16.dp),
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(16.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column {
                                            Text(
                                                text = "Order #${order.order_number}",
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 15.sp
                                            )
                                            Text(
                                                text = "${order.order_type} • ${order.payment_method}",
                                                fontSize = 12.sp,
                                                color = Color.Gray
                                            )
                                        }

                                        Column(horizontalAlignment = Alignment.End) {
                                            Text(
                                                text = "₹${order.total_amount.toInt()}",
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 16.sp,
                                                color = MaterialTheme.colorScheme.primary
                                            )
                                            Spacer(modifier = Modifier.height(4.dp))
                                            OrderStatusBadge(status = order.status)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if (showPinDialog) {
            com.maduraifoodcorner.admin.ui.screens.reports.PinPasswordDialog(
                onDismiss = { showPinDialog = false },
                onVerify = { pin ->
                    if (pin == "2401") {
                        isRevenueUnlocked = true
                        showPinDialog = false
                    }
                }
            )
        }
    }
}
