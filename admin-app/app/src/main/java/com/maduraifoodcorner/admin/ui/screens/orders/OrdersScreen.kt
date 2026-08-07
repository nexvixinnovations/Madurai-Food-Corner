package com.maduraifoodcorner.admin.ui.screens.orders

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.maduraifoodcorner.admin.data.model.Order
import com.maduraifoodcorner.admin.ui.components.LoadingState
import com.maduraifoodcorner.admin.ui.components.OrderStatusBadge

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrdersScreen(
    onOpenDrawer: () -> Unit,
    onOrderClick: (String) -> Unit,
    viewModel: OrdersViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedTab by remember { mutableStateOf("All Orders") }
    val tabs = listOf("All Orders", "Website Orders", "Shop Orders")

    // Automatically fetch fresh orders whenever OrdersScreen is opened
    LaunchedEffect(Unit) {
        viewModel.loadOrders(null)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Customer Orders", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onOpenDrawer) {
                        Icon(Icons.Default.Menu, contentDescription = "Drawer")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.loadOrders(null) }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
        ) {
            // Source Tabs Filter (All Orders | Website Orders | Shop Orders)
            TabRow(
                selectedTabIndex = tabs.indexOf(selectedTab)
            ) {
                tabs.forEach { tab ->
                    Tab(
                        selected = selectedTab == tab,
                        onClick = {
                            selectedTab = tab
                        },
                        text = { Text(tab, fontSize = 13.sp, fontWeight = FontWeight.Bold) }
                    )
                }
            }

            Box(modifier = Modifier.fillMaxSize()) {
                when (val state = uiState) {
                    is OrdersState.Loading -> LoadingState("Loading orders...")
                    is OrdersState.Error -> {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text(text = state.message, color = MaterialTheme.colorScheme.error)
                        }
                    }
                    is OrdersState.Success -> {
                        // Filter orders based on selected tab source
                        val filteredOrders = remember(state.orders, selectedTab) {
                            when (selectedTab) {
                                "Website Orders" -> state.orders.filter { it.order_source.equals("website", ignoreCase = true) }
                                "Shop Orders" -> state.orders.filter { 
                                    if (it.order_source.equals("website", ignoreCase = true)) return@filter false
                                    isOrderInCurrentShopWindow(it.created_at)
                                }
                                else -> state.orders
                            }
                        }

                        if (filteredOrders.isEmpty()) {
                            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                Text("No $selectedTab found today.", color = Color.Gray)
                            }
                        } else {
                            val totalAmountSum = filteredOrders.sumOf { it.total_amount }

                            LazyColumn(
                                modifier = Modifier.fillMaxSize(),
                                contentPadding = PaddingValues(16.dp),
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                // Total Amount Calculation Summary Header Card
                                item {
                                    Card(
                                        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E3A8A)),
                                        shape = RoundedCornerShape(16.dp),
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(bottom = 4.dp)
                                    ) {
                                        Row(
                                            modifier = Modifier
                                                .padding(16.dp)
                                                .fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Column {
                                                Text(
                                                    text = "$selectedTab Summary",
                                                    color = Color.White.copy(alpha = 0.8f),
                                                    fontSize = 12.sp,
                                                    fontWeight = FontWeight.Medium
                                                )
                                                Text(
                                                    text = "${filteredOrders.size} Confirmed ${if (filteredOrders.size == 1) "Order" else "Orders"}",
                                                    color = Color.White,
                                                    fontSize = 14.sp,
                                                    fontWeight = FontWeight.Bold
                                                )
                                            }
                                            Column(horizontalAlignment = Alignment.End) {
                                                Text(
                                                    text = "Total Calculation",
                                                    color = Color.White.copy(alpha = 0.8f),
                                                    fontSize = 11.sp
                                                )
                                                Text(
                                                    text = "₹${totalAmountSum.toInt()}",
                                                    color = Color(0xFFFFD700),
                                                    fontSize = 20.sp,
                                                    fontWeight = FontWeight.ExtraBold
                                                )
                                            }
                                        }
                                    }
                                }

                                if (selectedTab == "Website Orders" && viewModel.settings.value != null) {
                                    val start = viewModel.settings.value?.website_order_window_start ?: "14:00"
                                    val end = viewModel.settings.value?.website_order_window_end ?: "11:15"
                                    
                                    val groupedOrders = filteredOrders.groupBy { getWebsiteOrderDisplayGroup(it.created_at, start, end) }
                                    
                                    groupedOrders.forEach { (dateHeader, ordersForDate) ->
                                        item {
                                            Text(
                                                text = dateHeader,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 14.sp,
                                                color = MaterialTheme.colorScheme.primary,
                                                modifier = Modifier.padding(top = 8.dp, bottom = 4.dp)
                                            )
                                        }
                                        items(ordersForDate) { order ->
                                            OrderItemCard(
                                                order = order,
                                                onClick = { onOrderClick(order.id) }
                                            )
                                        }
                                    }
                                } else {
                                    items(filteredOrders) { order ->
                                        OrderItemCard(
                                            order = order,
                                            onClick = { onOrderClick(order.id) }
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

private fun isOrderInCurrentShopWindow(createdAtStr: String?): Boolean {
    if (createdAtStr.isNullOrEmpty()) return false
    try {
        val format = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US)
        format.timeZone = java.util.TimeZone.getTimeZone("UTC")
        val date = format.parse(createdAtStr.take(19)) ?: return false

        val cal = java.util.Calendar.getInstance()
        val now = java.util.Calendar.getInstance()
        
        cal.time = date

        if (cal.get(java.util.Calendar.YEAR) == now.get(java.util.Calendar.YEAR) &&
            cal.get(java.util.Calendar.DAY_OF_YEAR) == now.get(java.util.Calendar.DAY_OF_YEAR)
        ) {
            val hour = cal.get(java.util.Calendar.HOUR_OF_DAY)
            return hour in 6..21
        }
        return false
    } catch (e: Exception) {
        return true
    }
}

private fun getWebsiteOrderDisplayGroup(createdAtStr: String?, windowStart: String, windowEnd: String): String {
    if (createdAtStr.isNullOrEmpty()) return "Unknown Date"
    try {
        val format = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US)
        format.timeZone = java.util.TimeZone.getTimeZone("UTC")
        val date = format.parse(createdAtStr.take(19)) ?: return "Unknown Date"
        
        val cal = java.util.Calendar.getInstance()
        cal.time = date
        
        val startParts = windowStart.split(":")
        val startH = startParts.getOrNull(0)?.toIntOrNull() ?: 14
        val startM = startParts.getOrNull(1)?.toIntOrNull() ?: 0
        
        val endParts = windowEnd.split(":")
        val endH = endParts.getOrNull(0)?.toIntOrNull() ?: 11
        val endM = endParts.getOrNull(1)?.toIntOrNull() ?: 15
        
        val orderHour = cal.get(java.util.Calendar.HOUR_OF_DAY)
        val orderMin = cal.get(java.util.Calendar.MINUTE)
        
        val orderTimeMin = orderHour * 60 + orderMin
        val startTimeMin = startH * 60 + startM
        val endTimeMin = endH * 60 + endM
        
        if (startTimeMin > endTimeMin) {
            if (orderTimeMin >= startTimeMin) {
                cal.add(java.util.Calendar.DAY_OF_YEAR, 1)
            }
        }
        
        val displayFormat = java.text.SimpleDateFormat("EEEE, MMM dd, yyyy", java.util.Locale.US)
        return displayFormat.format(cal.time)
    } catch (e: Exception) {
        return "Unknown Date"
    }
}

@Composable
fun OrderItemCard(
    order: Order,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "#${order.order_number}",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    OrderStatusBadge(status = order.status.ifEmpty { "Accepted" })
                }
                Text(
                    text = "₹${order.total_amount.toInt()}",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 18.sp,
                    color = MaterialTheme.colorScheme.primary
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Type: ${order.order_type} • Source: ${order.order_source} • Pay: ${order.payment_method}",
                fontSize = 12.sp,
                color = Color.Gray
            )

            if (!order.customers?.name.isNull_or_empty()) {
                Text(
                    text = "Customer: ${order.customers?.name} (${order.customers?.phone})",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}

private fun String?.isNull_or_empty(): Boolean = this == null || this.isEmpty()
