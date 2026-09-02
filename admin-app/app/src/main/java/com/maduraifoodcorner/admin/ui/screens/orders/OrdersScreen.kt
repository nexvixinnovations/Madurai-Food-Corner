package com.maduraifoodcorner.admin.ui.screens.orders

import android.app.DatePickerDialog
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.maduraifoodcorner.admin.data.model.Order
import com.maduraifoodcorner.admin.ui.components.LoadingState
import com.maduraifoodcorner.admin.ui.components.OrderStatusBadge
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone

data class DateItem(
    val iso: String,
    val dayName: String,
    val dayNum: String,
    val monthName: String,
    val isToday: Boolean
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrdersScreen(
    onOpenDrawer: () -> Unit,
    onOrderClick: (String) -> Unit,
    viewModel: OrdersViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val uiState by viewModel.uiState.collectAsState()

    val isoFormat = remember { SimpleDateFormat("yyyy-MM-dd", Locale.US) }
    val displayDateFormat = remember { SimpleDateFormat("EEE, dd MMM yyyy", Locale.US) }
    val todayIso = remember { isoFormat.format(Date()) }

    var selectedDateIso by remember { mutableStateOf(todayIso) }
    var selectedTab by remember { mutableStateOf("All Orders") }
    val tabs = listOf("All Orders", "Website Orders", "Shop Orders")

    // Generate rolling dates list around today (e.g., -14 days to +7 days)
    val calendarDays = remember {
        val list = mutableListOf<DateItem>()
        val cal = Calendar.getInstance()
        cal.add(Calendar.DAY_OF_YEAR, -14)

        val dayNameFormat = SimpleDateFormat("EEE", Locale.US)
        val dayNumFormat = SimpleDateFormat("dd", Locale.US)
        val monthFormat = SimpleDateFormat("MMM", Locale.US)

        for (i in 0..21) {
            val d = cal.time
            val iso = isoFormat.format(d)
            list.add(
                DateItem(
                    iso = iso,
                    dayName = dayNameFormat.format(d).uppercase(),
                    dayNum = dayNumFormat.format(d),
                    monthName = monthFormat.format(d).uppercase(),
                    isToday = iso == todayIso
                )
            )
            cal.add(Calendar.DAY_OF_YEAR, 1)
        }
        list
    }

    // Full Calendar DatePickerDialog Trigger
    val showDatePicker = {
        val cal = Calendar.getInstance()
        try {
            val parsed = isoFormat.parse(selectedDateIso)
            if (parsed != null) cal.time = parsed
        } catch (_: Exception) {}

        DatePickerDialog(
            context,
            { _, year, month, dayOfMonth ->
                val newCal = Calendar.getInstance()
                newCal.set(year, month, dayOfMonth)
                selectedDateIso = isoFormat.format(newCal.time)
            },
            cal.get(Calendar.YEAR),
            cal.get(Calendar.MONTH),
            cal.get(Calendar.DAY_OF_MONTH)
        ).show()
    }

    // Auto-fetch fresh orders on launch
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
                    IconButton(onClick = { showDatePicker() }) {
                        Icon(Icons.Default.DateRange, contentDescription = "Calendar Picker", tint = MaterialTheme.colorScheme.primary)
                    }
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
            // ── Calendar Date Navigation Header Bar ──────────────────────────
            Surface(
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(vertical = 4.dp)) {
                    // Date Navigation Row with Left/Right Arrows and Date Badge
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(
                            onClick = {
                                val cal = Calendar.getInstance()
                                try {
                                    val parsed = isoFormat.parse(selectedDateIso)
                                    if (parsed != null) cal.time = parsed
                                } catch (_: Exception) {}
                                cal.add(Calendar.DAY_OF_YEAR, -1)
                                selectedDateIso = isoFormat.format(cal.time)
                            },
                            modifier = Modifier.size(36.dp)
                        ) {
                            Icon(Icons.Default.ChevronLeft, contentDescription = "Previous Day")
                        }

                        // Clickable Calendar Date Badge
                        Card(
                            onClick = { showDatePicker() },
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.35f)),
                            modifier = Modifier.padding(horizontal = 4.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.Center
                            ) {
                                Icon(
                                    Icons.Default.DateRange,
                                    contentDescription = "Pick Date",
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                val headerLabel = formatHeaderDate(selectedDateIso, todayIso, displayDateFormat, isoFormat)
                                Text(
                                    text = headerLabel,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }

                        IconButton(
                            onClick = {
                                val cal = Calendar.getInstance()
                                try {
                                    val parsed = isoFormat.parse(selectedDateIso)
                                    if (parsed != null) cal.time = parsed
                                } catch (_: Exception) {}
                                cal.add(Calendar.DAY_OF_YEAR, 1)
                                selectedDateIso = isoFormat.format(cal.time)
                            },
                            modifier = Modifier.size(36.dp)
                        ) {
                            Icon(Icons.Default.ChevronRight, contentDescription = "Next Day")
                        }
                    }

                    // Horizontal Quick-Tap Date Selector Strip
                    val listState = rememberLazyListState()
                    LaunchedEffect(selectedDateIso) {
                        val index = calendarDays.indexOfFirst { it.iso == selectedDateIso }
                        if (index >= 0) {
                            listState.animateScrollToItem(maxOf(0, index - 2))
                        }
                    }

                    LazyRow(
                        state = listState,
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        items(calendarDays) { day ->
                            val isSelected = selectedDateIso == day.iso
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.Center,
                                modifier = Modifier
                                    .width(52.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(
                                        if (isSelected) MaterialTheme.colorScheme.primary
                                        else if (day.isToday) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f)
                                        else MaterialTheme.colorScheme.surface
                                    )
                                    .clickable { selectedDateIso = day.iso }
                                    .padding(vertical = 6.dp)
                            ) {
                                Text(
                                    text = day.dayName,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isSelected) Color.White.copy(alpha = 0.85f) else Color.Gray
                                )
                                Text(
                                    text = day.dayNum,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = day.monthName,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = if (isSelected) Color.White.copy(alpha = 0.85f) else Color.Gray
                                )
                            }
                        }

                        // Full Calendar Picker Button at End of Strip
                        item {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.Center,
                                modifier = Modifier
                                    .width(56.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(MaterialTheme.colorScheme.surface)
                                    .clickable { showDatePicker() }
                                    .padding(vertical = 8.dp)
                            ) {
                                Icon(
                                    Icons.Default.CalendarMonth,
                                    contentDescription = "Pick Any Date",
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = "CALENDAR",
                                    fontSize = 8.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                    }
                }
            }

            // ── Source Tabs Filter (All Orders | Website Orders | Shop Orders) ──
            TabRow(
                selectedTabIndex = tabs.indexOf(selectedTab)
            ) {
                tabs.forEach { tab ->
                    Tab(
                        selected = selectedTab == tab,
                        onClick = { selectedTab = tab },
                        text = { Text(tab, fontSize = 12.sp, fontWeight = FontWeight.Bold) }
                    )
                }
            }

            // ── Main Content: Orders on Selected Date ────────────────────────
            Box(modifier = Modifier.fillMaxSize()) {
                when (val state = uiState) {
                    is OrdersState.Loading -> LoadingState("Loading orders...")
                    is OrdersState.Error -> {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text(text = state.message, color = MaterialTheme.colorScheme.error)
                        }
                    }
                    is OrdersState.Success -> {
                        // 1. Filter orders matching selected date (by required_date or created_at)
                        val ordersOnDate = remember(state.orders, selectedDateIso) {
                            state.orders.filter { order ->
                                isOrderOnDate(order, selectedDateIso)
                            }
                        }

                        // 2. Filter by Source Tab (All / Website / Shop)
                        val filteredOrders = remember(ordersOnDate, selectedTab) {
                            when (selectedTab) {
                                "Website Orders" -> ordersOnDate.filter { it.order_source.equals("website", ignoreCase = true) }
                                "Shop Orders" -> ordersOnDate.filter { !it.order_source.equals("website", ignoreCase = true) }
                                else -> ordersOnDate
                            }
                        }

                        if (filteredOrders.isEmpty()) {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(24.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        Icons.Default.EventBusy,
                                        contentDescription = "No Orders",
                                        modifier = Modifier.size(48.dp),
                                        tint = Color.Gray.copy(alpha = 0.5f)
                                    )
                                    Text(
                                        text = "No $selectedTab found on ${formatHeaderDate(selectedDateIso, todayIso, displayDateFormat, isoFormat)}.",
                                        color = Color.Gray,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Medium,
                                        textAlign = TextAlign.Center
                                    )
                                    if (selectedDateIso != todayIso) {
                                        Button(
                                            onClick = { selectedDateIso = todayIso },
                                            modifier = Modifier.padding(top = 8.dp)
                                        ) {
                                            Text("View Today's Orders")
                                        }
                                    }
                                }
                            }
                        } else {
                            LazyColumn(
                                modifier = Modifier.fillMaxSize(),
                                contentPadding = PaddingValues(16.dp),
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
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

/**
 * Checks if an order falls on the given target ISO date (YYYY-MM-DD)
 * Evaluates both required_date and created_at timestamps.
 */
private fun isOrderOnDate(order: Order, targetDateIso: String): Boolean {
    // 1. Direct required_date match
    val reqDate = order.required_date.take(10)
    if (reqDate == targetDateIso) return true

    // 2. Created_at match (handling UTC/ISO string)
    val createdAt = order.created_at
    if (!createdAt.isNullOrEmpty()) {
        try {
            val utcFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US)
            utcFormat.timeZone = TimeZone.getTimeZone("UTC")
            val date = utcFormat.parse(createdAt.take(19))
            if (date != null) {
                val localFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                if (localFormat.format(date) == targetDateIso) return true
            }
        } catch (_: Exception) {
            if (createdAt.startsWith(targetDateIso)) return true
        }
    }

    return false
}

/**
 * Format header label e.g., "Today • Tue, 25 Aug 2026" or "Wed, 26 Aug 2026"
 */
private fun formatHeaderDate(
    iso: String,
    todayIso: String,
    displayFormat: SimpleDateFormat,
    isoFormat: SimpleDateFormat
): String {
    return try {
        val date = isoFormat.parse(iso)
        val formatted = if (date != null) displayFormat.format(date) else iso
        if (iso == todayIso) {
            "Today • $formatted"
        } else {
            formatted
        }
    } catch (_: Exception) {
        iso
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

            if (!order.customers?.name.isNullOrEmpty() &&
                order.customers?.name?.lowercase() !in listOf("counter customer", "test user", "walk-in", "guest") &&
                order.customers?.phone != "9999999999"
            ) {
                Text(
                    text = "Customer: ${order.customers?.name} (${order.customers?.phone})",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}
