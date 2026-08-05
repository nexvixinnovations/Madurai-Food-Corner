package com.maduraifoodcorner.admin.ui.screens.settings

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.maduraifoodcorner.admin.ui.components.LoadingState
import java.text.SimpleDateFormat
import java.util.*

data class CalendarDay(
    val dateIso: String,
    val dayNumber: Int,
    val dayOfWeek: String,
    val isToday: Boolean
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onOpenDrawer: () -> Unit,
    viewModel: SettingsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val serverIp by viewModel.serverIp.collectAsState()
    val dateWiseOrderingEnabled by viewModel.dateWiseOrderingEnabled.collectAsState()
    val disabledDates by viewModel.disabledDates.collectAsState()

    val orderDiscountEnabled by viewModel.orderDiscountEnabled.collectAsState()
    val tier1MinAmount by viewModel.tier1MinAmount.collectAsState()
    val tier1Percentage by viewModel.tier1Percentage.collectAsState()

    val orderingScheduleEnabled by viewModel.orderingScheduleEnabled.collectAsState()
    val orderingStartTime by viewModel.orderingStartTime.collectAsState()
    val orderingEndTime by viewModel.orderingEndTime.collectAsState()
    val orderingTimeScope by viewModel.orderingTimeScope.collectAsState()

    val isSaving by viewModel.isSaving.collectAsState()
    val context = LocalContext.current

    // Validation state
    var minAmountError by remember { mutableStateOf<String?>(null) }
    var percentageError by remember { mutableStateOf<String?>(null) }

    val calendarDays = remember {
        val list = mutableListOf<CalendarDay>()
        val cal = Calendar.getInstance()
        val isoFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        val dayFormat = SimpleDateFormat("E", Locale.US)
        val todayStr = isoFormat.format(cal.time)

        for (i in 0 until 28) {
            val dateIso = isoFormat.format(cal.time)
            val dayNum = cal.get(Calendar.DAY_OF_MONTH)
            val dayOfWeek = dayFormat.format(cal.time)
            list.add(
                CalendarDay(
                    dateIso = dateIso,
                    dayNumber = dayNum,
                    dayOfWeek = dayOfWeek,
                    isToday = dateIso == todayStr
                )
            )
            cal.add(Calendar.DAY_OF_YEAR, 1)
        }
        list
    }

    // Live discount preview calculation
    val minAmountVal = tier1MinAmount.toDoubleOrNull() ?: 0.0
    val percentageVal = tier1Percentage.toDoubleOrNull() ?: 0.0

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Restaurant Configurations", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onOpenDrawer) {
                        Icon(Icons.Default.Menu, contentDescription = "Drawer")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.loadSettings() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        }
    ) { padding ->
        Box(modifier = Modifier.padding(padding).fillMaxSize()) {
            when (val state = uiState) {
                is SettingsState.Loading -> LoadingState("Loading configuration settings...")
                is SettingsState.Error -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(text = state.message, color = MaterialTheme.colorScheme.error)
                            Spacer(modifier = Modifier.height(8.dp))
                            Button(onClick = { viewModel.loadSettings() }) {
                                Text("Retry")
                            }
                        }
                    }
                }
                is SettingsState.Success -> {
                    val settings = state.settings

                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {

                        // ─── 1. ORDER VALUE DISCOUNT CARD ───────────────────────────────
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = if (orderDiscountEnabled)
                                    MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f)
                                else
                                    MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
                            )
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                // Header row with icon + title + switch
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            Icons.Default.LocalOffer,
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.primary,
                                            modifier = Modifier.size(20.dp)
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(
                                            text = "Order Value Discount",
                                            fontWeight = FontWeight.ExtraBold,
                                            fontSize = 16.sp
                                        )
                                    }
                                    Switch(
                                        checked = orderDiscountEnabled,
                                        onCheckedChange = { viewModel.setOrderDiscountEnabled(it) }
                                    )
                                }

                                Text(
                                    text = "Percentage discount on eligible cart subtotal (Regular Items + Combos). " +
                                           "Special Offers (₹99 SPECIAL etc.) are excluded from both the threshold and discount.",
                                    fontSize = 11.sp,
                                    color = Color.Gray,
                                    lineHeight = 15.sp
                                )

                                Spacer(modifier = Modifier.height(14.dp))

                                // Minimum Order Amount
                                OutlinedTextField(
                                    value = tier1MinAmount,
                                    onValueChange = { v ->
                                        viewModel.setTier1MinAmount(v)
                                        val parsed = v.toDoubleOrNull()
                                        minAmountError = when {
                                            v.isBlank() -> null
                                            parsed == null -> "Enter a valid amount"
                                            parsed <= 0 -> "Must be greater than ₹0"
                                            else -> null
                                        }
                                    },
                                    label = { Text("Minimum Eligible Subtotal (₹)") },
                                    placeholder = { Text("e.g. 399") },
                                    leadingIcon = { Text("₹", fontWeight = FontWeight.Bold, fontSize = 14.sp, modifier = Modifier.padding(start = 4.dp)) },
                                    isError = minAmountError != null,
                                    supportingText = minAmountError?.let { { Text(it, color = MaterialTheme.colorScheme.error, fontSize = 11.sp) } },
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                    enabled = orderDiscountEnabled
                                )

                                Spacer(modifier = Modifier.height(8.dp))

                                // Discount Percentage
                                OutlinedTextField(
                                    value = tier1Percentage,
                                    onValueChange = { v ->
                                        viewModel.setTier1Percentage(v)
                                        val parsed = v.toDoubleOrNull()
                                        percentageError = when {
                                            v.isBlank() -> null
                                            parsed == null -> "Enter a valid percentage"
                                            parsed <= 0 -> "Must be greater than 0%"
                                            parsed > 100 -> "Cannot exceed 100%"
                                            else -> null
                                        }
                                    },
                                    label = { Text("Discount Percentage (%)") },
                                    placeholder = { Text("e.g. 10") },
                                    trailingIcon = { Text("%", fontWeight = FontWeight.Bold, fontSize = 14.sp, modifier = Modifier.padding(end = 4.dp)) },
                                    isError = percentageError != null,
                                    supportingText = percentageError?.let { { Text(it, color = MaterialTheme.colorScheme.error, fontSize = 11.sp) } },
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                    enabled = orderDiscountEnabled
                                )

                                // Live Preview
                                if (orderDiscountEnabled && minAmountVal > 0 && percentageVal > 0 && minAmountError == null && percentageError == null) {
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Surface(
                                        shape = RoundedCornerShape(10.dp),
                                        color = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Column(modifier = Modifier.padding(12.dp)) {
                                            Text(
                                                text = "🔥 Preview",
                                                fontWeight = FontWeight.ExtraBold,
                                                fontSize = 11.sp,
                                                color = MaterialTheme.colorScheme.primary
                                            )
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Text(
                                                text = "Orders ≥ ₹${minAmountVal.toInt()} → ${percentageVal.toInt()}% OFF on Regular Items & Combos",
                                                fontSize = 12.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                            Text(
                                                text = "Example: ₹${minAmountVal.toInt()} eligible subtotal → -₹${"%.2f".format(minAmountVal * percentageVal / 100)} discount",
                                                fontSize = 11.sp,
                                                color = Color.Gray
                                            )
                                            Text(
                                                text = "⚠ Special Offer items (₹99 SPECIAL etc.) are excluded.",
                                                fontSize = 10.sp,
                                                color = Color(0xFFE65100)
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        // ─── 2. Ordering Time Schedule Settings Card ─────────────────────
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.Schedule, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(text = "Daily Ordering Time Window", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                    }
                                    Switch(
                                        checked = orderingScheduleEnabled,
                                        onCheckedChange = { viewModel.setOrderingScheduleEnabled(it) }
                                    )
                                }

                                Text(
                                    text = "Set daily ordering acceptance window (e.g. Orders accepted from Today 2:00 PM (14:00) to Tomorrow 10:00 AM (10:00)). Advertised on website banner.",
                                    fontSize = 11.sp,
                                    color = Color.Gray
                                )

                                Spacer(modifier = Modifier.height(12.dp))

                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    OutlinedTextField(
                                        value = orderingStartTime,
                                        onValueChange = { viewModel.setOrderingStartTime(it) },
                                        label = { Text("Start Time (24h)") },
                                        placeholder = { Text("14:00") },
                                        singleLine = true,
                                        modifier = Modifier.weight(1f)
                                    )

                                    OutlinedTextField(
                                        value = orderingEndTime,
                                        onValueChange = { viewModel.setOrderingEndTime(it) },
                                        label = { Text("End Time (24h)") },
                                        placeholder = { Text("10:00") },
                                        singleLine = true,
                                        modifier = Modifier.weight(1f)
                                    )
                                }

                                Spacer(modifier = Modifier.height(8.dp))
                                Text("Repeat Schedule Scope:", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    FilterChip(
                                        selected = orderingTimeScope == "EVERYDAY",
                                        onClick = { viewModel.setOrderingTimeScope("EVERYDAY") },
                                        label = { Text("Every Day (Repeating)", fontSize = 11.sp) }
                                    )
                                    FilterChip(
                                        selected = orderingTimeScope == "SPECIFIC_DATE",
                                        onClick = { viewModel.setOrderingTimeScope("SPECIFIC_DATE") },
                                        label = { Text("Specific Date Only", fontSize = 11.sp) }
                                    )
                                }
                            }
                        }

                        // ─── 3. Date-Wise Ordering Calendar Card ──────────────────────────
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.DateRange, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(text = "Date-Wise Ordering Calendar", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                    }

                                    Switch(
                                        checked = dateWiseOrderingEnabled,
                                        onCheckedChange = { viewModel.setDateWiseOrderingEnabled(it) }
                                    )
                                }

                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Tap a date to toggle between OPEN (Green) and CLOSED (Red). Website checkout will strictly enforce these date rules from database.",
                                    fontSize = 12.sp,
                                    color = Color.Gray
                                )

                                Spacer(modifier = Modifier.height(12.dp))

                                // Color Legend
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceEvenly
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Box(
                                            modifier = Modifier
                                                .size(14.dp)
                                                .background(Color(0xFF2E7D32), CircleShape)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("OPEN (Green)", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF2E7D32))
                                    }

                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Box(
                                            modifier = Modifier
                                                .size(14.dp)
                                                .background(Color(0xFFC62828), CircleShape)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("CLOSED (Red)", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFFC62828))
                                    }
                                }

                                Spacer(modifier = Modifier.height(12.dp))

                                // 28-Day Grid Picker
                                val dayGridHeight = (70 * 4).dp
                                LazyVerticalGrid(
                                    columns = GridCells.Fixed(7),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(dayGridHeight),
                                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                                    verticalArrangement = Arrangement.spacedBy(4.dp),
                                    userScrollEnabled = false
                                ) {
                                    items(calendarDays) { day ->
                                        val isClosed = disabledDates.contains(day.dateIso)
                                        val bgColor = if (isClosed) Color(0xFFC62828) else Color(0xFF2E7D32)

                                        Box(
                                            modifier = Modifier
                                                .aspectRatio(0.9f)
                                                .clip(RoundedCornerShape(8.dp))
                                                .background(bgColor)
                                                .clickable {
                                                    viewModel.toggleDisabledDate(day.dateIso)
                                                }
                                                .padding(2.dp),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                                Text(
                                                    text = day.dayOfWeek,
                                                    fontSize = 9.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = Color.White.copy(alpha = 0.8f)
                                                )
                                                Text(
                                                    text = "${day.dayNumber}",
                                                    fontSize = 14.sp,
                                                    fontWeight = FontWeight.ExtraBold,
                                                    color = Color.White
                                                )
                                                Text(
                                                    text = if (isClosed) "OFF" else "ON",
                                                    fontSize = 8.sp,
                                                    fontWeight = FontWeight.Black,
                                                    color = Color.White.copy(alpha = 0.9f)
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // ─── Save Configuration Button ────────────────────────────────────
                        Button(
                            onClick = {
                                // Validate before saving
                                if (orderDiscountEnabled) {
                                    val minAmt = tier1MinAmount.toDoubleOrNull()
                                    val pct = tier1Percentage.toDoubleOrNull()
                                    if (minAmt == null || minAmt <= 0) {
                                        Toast.makeText(context, "Enter a valid minimum amount (> ₹0)", Toast.LENGTH_SHORT).show()
                                        return@Button
                                    }
                                    if (pct == null || pct <= 0 || pct > 100) {
                                        Toast.makeText(context, "Enter a valid discount percentage (0%–100%)", Toast.LENGTH_SHORT).show()
                                        return@Button
                                    }
                                }
                                viewModel.saveSettings(
                                    currentSettings = settings,
                                    calendarDaysIso = calendarDays.map { it.dateIso },
                                    onSuccess = {
                                        Toast.makeText(context, "Settings Saved Successfully!", Toast.LENGTH_LONG).show()
                                    },
                                    onError = { err ->
                                        Toast.makeText(context, "Error: $err", Toast.LENGTH_LONG).show()
                                    }
                                )
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(52.dp),
                            shape = RoundedCornerShape(16.dp),
                            enabled = !isSaving
                        ) {
                            if (isSaving) {
                                CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White)
                            } else {
                                Icon(Icons.Default.Save, contentDescription = null)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("SAVE ALL SETTINGS", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}
