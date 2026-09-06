package com.maduraifoodcorner.admin.ui.screens.billing

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import com.maduraifoodcorner.admin.ui.components.LoadingState
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BillingScreen(
    onOpenDrawer: () -> Unit,
    viewModel: BillingViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val cartItems by viewModel.cartItems.collectAsState()
    val discountBreakdown by viewModel.discountBreakdown.collectAsState()
    val unsyncedOrders by viewModel.unsyncedOrders.collectAsState()
    val isSyncing by viewModel.isSyncing.collectAsState()
    val syncProgress by viewModel.syncProgress.collectAsState()
    val lastSyncResult by viewModel.lastSyncResult.collectAsState()
    val showRevenueDialog by viewModel.showRevenueDialog.collectAsState()
    val isOfflineMode by viewModel.isOfflineMode.collectAsState()

    val context = LocalContext.current

    var selectedCategory by remember { mutableStateOf("All") }
    var searchQuery by remember { mutableStateOf("") }
    var showOrderPickerSheet by remember { mutableStateOf(false) }
    var showQueueSheet by remember { mutableStateOf(false) }

    val eligibleSubtotal = discountBreakdown.eligibleSubtotal
    val specialOfferSubtotal = discountBreakdown.specialOfferSubtotal
    val discountPct = discountBreakdown.discountPercent.toInt()
    val discountAmt = discountBreakdown.discountAmount
    val grandTotal = discountBreakdown.grandTotal

    val pendingTotalRevenue = unsyncedOrders.sumOf { it.order.total_amount }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Counter POS Billing", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                            if (isOfflineMode) {
                                Spacer(modifier = Modifier.width(6.dp))
                                Surface(
                                    color = Color(0xFFFFF3E0),
                                    shape = RoundedCornerShape(4.dp)
                                ) {
                                    Text(
                                        "OFFLINE",
                                        color = Color(0xFFE65100),
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                    )
                                }
                            }
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onOpenDrawer) {
                        Icon(Icons.Default.Menu, contentDescription = "Drawer")
                    }
                },
                actions = {
                    IconButton(onClick = { showOrderPickerSheet = true }) {
                        Icon(Icons.Default.CloudDownload, contentDescription = "Load Website Orders")
                    }
                    IconButton(onClick = { viewModel.loadData() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh Catalog")
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
            // ─── Offline Queue & Server Sync Banner ────────────────────────
            Surface(
                color = if (unsyncedOrders.isNotEmpty()) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .padding(horizontal = 12.dp, vertical = 8.dp)
                        .fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .weight(1f)
                            .clickable { if (unsyncedOrders.isNotEmpty()) showQueueSheet = true }
                    ) {
                        Icon(
                            imageVector = if (unsyncedOrders.isNotEmpty()) Icons.Default.Inventory else Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = if (unsyncedOrders.isNotEmpty()) MaterialTheme.colorScheme.primary else Color(0xFF2E7D32),
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            if (unsyncedOrders.isNotEmpty()) {
                                Text(
                                    text = "${unsyncedOrders.size} Offline Orders Pending",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                                Text(
                                    text = "Queue Total: ₹${"%.0f".format(pendingTotalRevenue)} (Tap to view)",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                                )
                            } else {
                                Text(
                                    text = "All Orders Synced to Server",
                                    fontWeight = FontWeight.Medium,
                                    fontSize = 12.sp,
                                    color = Color(0xFF2E7D32)
                                )
                                Text(
                                    text = "Ready for instant offline billing",
                                    fontSize = 10.sp,
                                    color = Color.Gray
                                )
                            }
                        }
                    }

                    // Sync to Data Server Button
                    Button(
                        onClick = {
                            if (unsyncedOrders.isEmpty()) {
                                Toast.makeText(context, "No offline orders to sync!", Toast.LENGTH_SHORT).show()
                            } else {
                                viewModel.syncAllOrdersToServer()
                            }
                        },
                        enabled = unsyncedOrders.isNotEmpty() && !isSyncing,
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary
                        ),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                    ) {
                        if (isSyncing) {
                            CircularProgressIndicator(modifier = Modifier.size(14.dp), color = Color.White, strokeWidth = 2.dp)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Syncing...", fontSize = 11.sp)
                        } else {
                            Icon(Icons.Default.CloudUpload, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Upload to Server", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // ─── Main Billing Body ──────────────────────────────────────────
            when (val state = uiState) {
                is BillingState.Idle, is BillingState.Loading -> LoadingState("Loading POS Catalog...")
                is BillingState.Error -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(16.dp)) {
                            Text(text = state.message, color = MaterialTheme.colorScheme.error, textAlign = TextAlign.Center)
                            Spacer(modifier = Modifier.height(12.dp))
                            Button(onClick = { viewModel.loadData() }) {
                                Text("Retry")
                            }
                        }
                    }
                }
                is BillingState.Success -> {
                    // Search & Filter Header
                    Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)) {
                        OutlinedTextField(
                            value = searchQuery,
                            onValueChange = { searchQuery = it },
                            placeholder = { Text("Search foods, combos, offers...", fontSize = 12.sp) },
                            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                            trailingIcon = {
                                if (searchQuery.isNotEmpty()) {
                                    IconButton(onClick = { searchQuery = "" }) {
                                        Icon(Icons.Default.Clear, contentDescription = null)
                                    }
                                }
                            },
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(6.dp))

                        // Category Chips
                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            items(state.categories) { cat ->
                                FilterChip(
                                    selected = selectedCategory == cat,
                                    onClick = { selectedCategory = cat },
                                    label = { Text(cat, fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                                )
                            }
                        }
                    }

                    val filteredCatalog = state.catalogItems.filter { item ->
                        val matchesCat = if (selectedCategory == "All") true else item.category.equals(selectedCategory, ignoreCase = true)
                        val matchesSearch = if (searchQuery.isBlank()) true else item.name.contains(searchQuery.trim(), ignoreCase = true)
                        matchesCat && matchesSearch
                    }

                    // Main Split Pane: Left Catalog | Right Cart
                    Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                        Row(modifier = Modifier.fillMaxSize()) {
                            // Left Section: POS Item Grid
                            Column(
                                modifier = Modifier
                                    .weight(1.1f)
                                    .fillMaxHeight()
                                    .padding(horizontal = 8.dp)
                            ) {
                                if (filteredCatalog.isEmpty()) {
                                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                        Text("No items found", color = Color.Gray, fontSize = 12.sp)
                                    }
                                } else {
                                    LazyVerticalGrid(
                                        columns = GridCells.Fixed(2),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                                        verticalArrangement = Arrangement.spacedBy(8.dp),
                                        contentPadding = PaddingValues(bottom = 12.dp)
                                    ) {
                                        items(filteredCatalog) { item ->
                                            Card(
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .clickable {
                                                        if (item.isAvailable) {
                                                            viewModel.addItemToCart(item)
                                                        } else {
                                                            Toast.makeText(context, "${item.name} is currently OFF", Toast.LENGTH_SHORT).show()
                                                        }
                                                    },
                                                shape = RoundedCornerShape(12.dp),
                                                colors = CardDefaults.cardColors(
                                                    containerColor = if (item.isAvailable) MaterialTheme.colorScheme.surface else Color.LightGray.copy(alpha = 0.3f)
                                                ),
                                                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                                            ) {
                                                Column(modifier = Modifier.padding(10.dp)) {
                                                    Text(
                                                        text = item.name,
                                                        fontWeight = FontWeight.Bold,
                                                        fontSize = 12.sp,
                                                        maxLines = 2
                                                    )
                                                    Spacer(modifier = Modifier.height(4.dp))
                                                    Row(
                                                        modifier = Modifier.fillMaxWidth(),
                                                        horizontalArrangement = Arrangement.SpaceBetween,
                                                        verticalAlignment = Alignment.CenterVertically
                                                    ) {
                                                        if (item.offerPrice != null) {
                                                            Text(
                                                                text = "₹${item.offerPrice.toInt()}",
                                                                fontWeight = FontWeight.ExtraBold,
                                                                fontSize = 13.sp,
                                                                color = MaterialTheme.colorScheme.primary
                                                            )
                                                            Text(
                                                                text = "₹${item.price.toInt()}",
                                                                fontSize = 10.sp,
                                                                color = Color.Gray,
                                                                textDecoration = TextDecoration.LineThrough
                                                            )
                                                        } else {
                                                            Text(
                                                                text = "₹${item.price.toInt()}",
                                                                fontWeight = FontWeight.Bold,
                                                                fontSize = 13.sp
                                                            )
                                                        }

                                                        if (!item.isAvailable) {
                                                            Text("OFF", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Red)
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                            VerticalDivider(modifier = Modifier.fillMaxHeight().width(1.dp))

                            // Right Section: Current Cart Summary
                            Column(
                                modifier = Modifier
                                    .weight(0.9f)
                                    .fillMaxHeight()
                                    .padding(8.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text("Cart (${cartItems.sumOf { it.quantity }})", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                    if (cartItems.isNotEmpty()) {
                                        TextButton(
                                            onClick = { viewModel.clearCart() },
                                            contentPadding = PaddingValues(0.dp)
                                        ) {
                                            Text("Clear", color = Color.Red, fontSize = 11.sp)
                                        }
                                    }
                                }

                                if (cartItems.isEmpty()) {
                                    Box(
                                        modifier = Modifier.weight(1f).fillMaxWidth(),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text("Tap items on left to add", fontSize = 11.sp, color = Color.Gray)
                                    }
                                } else {
                                    LazyColumn(
                                        modifier = Modifier.weight(1f),
                                        verticalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        items(cartItems) { line ->
                                            Card(
                                                shape = RoundedCornerShape(8.dp),
                                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                                elevation = CardDefaults.cardElevation(1.dp)
                                            ) {
                                                Row(
                                                    modifier = Modifier.padding(6.dp).fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.SpaceBetween,
                                                    verticalAlignment = Alignment.CenterVertically
                                                ) {
                                                    Column(modifier = Modifier.weight(1f)) {
                                                        Text(line.item.name, fontSize = 11.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                                                        Text("₹${line.unitPrice.toInt()} x ${line.quantity}", fontSize = 10.sp, color = Color.Gray)
                                                    }

                                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                                        IconButton(
                                                            onClick = { viewModel.decrementQuantity(line.item.id) },
                                                            modifier = Modifier.size(24.dp)
                                                        ) {
                                                            Icon(Icons.Default.Remove, contentDescription = null, modifier = Modifier.size(14.dp))
                                                        }
                                                        Text("${line.quantity}", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                                        IconButton(
                                                            onClick = { viewModel.incrementQuantity(line.item.id) },
                                                            modifier = Modifier.size(24.dp)
                                                        ) {
                                                            Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(14.dp))
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(8.dp))

                                // ─── Pricing & Complete Bill Action ──────────────────
                                Surface(
                                    color = MaterialTheme.colorScheme.surface,
                                    shape = RoundedCornerShape(12.dp),
                                    shadowElevation = 8.dp,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                        if (eligibleSubtotal > 0) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Text("Regular & Combo:", fontSize = 12.sp, color = Color.Gray, modifier = Modifier.weight(1f))
                                                Text("₹${"%.2f".format(eligibleSubtotal)}", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                            }
                                        }

                                        if (specialOfferSubtotal > 0) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Text("Special Offers:", fontSize = 12.sp, color = Color.Gray, modifier = Modifier.weight(1f))
                                                Text("₹${"%.2f".format(specialOfferSubtotal)}", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Color(0xFFE65100))
                                            }
                                        }

                                        if (discountPct > 0 && discountAmt > 0) {
                                            HorizontalDivider(modifier = Modifier.padding(vertical = 2.dp))
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Text("Order Discount ($discountPct%):", fontSize = 12.sp, color = Color(0xFF2E7D32), fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                                                Text("-₹${"%.2f".format(discountAmt)}", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Color(0xFF2E7D32))
                                            }
                                        }

                                        HorizontalDivider(modifier = Modifier.padding(vertical = 2.dp))

                                        // Grand Total
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text("GRAND TOTAL:", fontWeight = FontWeight.ExtraBold, fontSize = 14.sp, modifier = Modifier.weight(1f))
                                            Text("₹${"%.2f".format(grandTotal)}", fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = MaterialTheme.colorScheme.primary)
                                        }

                                        Spacer(modifier = Modifier.height(6.dp))

                                        // Instant Offline Bill & Print
                                        Button(
                                            onClick = {
                                                viewModel.completePosOrderOffline(
                                                    onSuccess = { createdOrder ->
                                                        Toast.makeText(context, "Bill #${createdOrder.order_number} Saved & Printing!", Toast.LENGTH_SHORT).show()
                                                    },
                                                    onError = { err ->
                                                        Toast.makeText(context, err, Toast.LENGTH_SHORT).show()
                                                    }
                                                )
                                            },
                                            enabled = cartItems.isNotEmpty(),
                                            shape = RoundedCornerShape(8.dp),
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            Icon(Icons.Default.Print, contentDescription = null, modifier = Modifier.size(16.dp))
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text("Complete & Print Bill", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // ─── Syncing Progress Dialog ────────────────────────────────────────
        if (isSyncing && syncProgress != null) {
            Dialog(onDismissRequest = { /* Prevent dismiss while syncing */ }) {
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = MaterialTheme.colorScheme.surface,
                    shadowElevation = 8.dp,
                    modifier = Modifier.padding(16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        CircularProgressIndicator(modifier = Modifier.size(40.dp))
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Uploading Orders to Server...",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        val (current, total) = syncProgress!!
                        Text(
                            text = "Syncing bill $current of $total",
                            fontSize = 12.sp,
                            color = Color.Gray
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        LinearProgressIndicator(
                            progress = { current.toFloat() / total.toFloat() },
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }
        }

        // ─── Revenue & Sync Summary Dialog ──────────────────────────────────
        if (showRevenueDialog && lastSyncResult != null) {
            val result = lastSyncResult!!
            val syncTime = SimpleDateFormat("hh:mm a, dd MMM yyyy", Locale.getDefault()).format(Date())

            AlertDialog(
                onDismissRequest = { viewModel.dismissRevenueDialog() },
                icon = {
                    Icon(
                        imageVector = if (result.failedCount == 0) Icons.Default.CheckCircle else Icons.Default.Warning,
                        contentDescription = null,
                        tint = if (result.failedCount == 0) Color(0xFF2E7D32) else Color(0xFFE65100),
                        modifier = Modifier.size(36.dp)
                    )
                },
                title = {
                    Text(
                        text = "Orders Synced & Revenue Summary",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        textAlign = TextAlign.Center
                    )
                },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = "Synced at: $syncTime",
                            fontSize = 11.sp,
                            color = Color.Gray
                        )

                        HorizontalDivider()

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Total Orders Synced:", fontSize = 13.sp)
                            Text("${result.successCount} / ${result.totalOrders}", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Total Batch Revenue:", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text("₹${"%.2f".format(result.totalRevenue)}", fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = MaterialTheme.colorScheme.primary)
                        }

                        Surface(
                            color = MaterialTheme.colorScheme.surfaceVariant,
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text("Cash Revenue:", fontSize = 12.sp, color = Color.Gray)
                                    Text("₹${"%.2f".format(result.cashRevenue)}", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text("Online / UPI Revenue:", fontSize = 12.sp, color = Color.Gray)
                                    Text("₹${"%.2f".format(result.onlineRevenue)}", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }
                            }
                        }

                        if (result.failedCount > 0) {
                            Text(
                                text = "⚠️ ${result.failedCount} orders failed to upload. They remain safely saved in offline queue.",
                                fontSize = 11.sp,
                                color = Color.Red
                            )
                        }
                    }
                },
                confirmButton = {
                    Button(
                        onClick = { viewModel.dismissRevenueDialog() },
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Done")
                    }
                }
            )
        }

        // ─── Offline Queue Review BottomSheet ──────────────────────────────
        if (showQueueSheet) {
            ModalBottomSheet(
                onDismissRequest = { showQueueSheet = false }
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Offline Bills Queue (${unsyncedOrders.size})", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text("Total: ₹${"%.0f".format(pendingTotalRevenue)}", fontWeight = FontWeight.ExtraBold, fontSize = 15.sp, color = MaterialTheme.colorScheme.primary)
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    if (unsyncedOrders.isEmpty()) {
                        Text("No pending offline orders.", color = Color.Gray, fontSize = 12.sp)
                    } else {
                        LazyColumn(
                            modifier = Modifier.weight(1f, fill = false),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(unsyncedOrders) { item ->
                                Card(
                                    shape = RoundedCornerShape(8.dp),
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                    elevation = CardDefaults.cardElevation(1.dp)
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(10.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = "Order #${item.order.order_number}",
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 13.sp
                                            )
                                            Text(
                                                text = "${item.order.order_items.size} items • ${item.order.payment_method} • ${item.order.required_time ?: ""}",
                                                fontSize = 11.sp,
                                                color = Color.Gray
                                            )
                                        }

                                        Text(
                                            text = "₹${"%.0f".format(item.order.total_amount)}",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp,
                                            color = MaterialTheme.colorScheme.primary
                                        )

                                        Spacer(modifier = Modifier.width(8.dp))

                                        IconButton(
                                            onClick = { viewModel.deleteOfflineOrder(item.localId) },
                                            modifier = Modifier.size(24.dp)
                                        ) {
                                            Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Color.Red, modifier = Modifier.size(16.dp))
                                        }
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Button(
                            onClick = {
                                showQueueSheet = false
                                viewModel.syncAllOrdersToServer()
                            },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(Icons.Default.CloudUpload, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Sync All (${unsyncedOrders.size}) to Server Now")
                        }
                    }
                }
            }
        }

        // ─── Website Order Picker BottomSheet ──────────────────────────────
        if (showOrderPickerSheet && uiState is BillingState.Success) {
            val pendingOrders = (uiState as BillingState.Success).pendingWebsiteOrders
            ModalBottomSheet(
                onDismissRequest = { showOrderPickerSheet = false }
            ) {
                Column(modifier = Modifier.padding(16.dp).fillMaxWidth()) {
                    Text(
                        text = "Pending Website Orders (${pendingOrders.size})",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    if (pendingOrders.isEmpty()) {
                        Text("No pending online orders at the moment", color = Color.Gray, fontSize = 12.sp)
                    } else {
                        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            items(pendingOrders) { order ->
                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable {
                                            viewModel.loadWebsiteOrderToCart(order)
                                            showOrderPickerSheet = false
                                            Toast.makeText(context, "Loaded #${order.order_number} to cart", Toast.LENGTH_SHORT).show()
                                        },
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Column(modifier = Modifier.padding(12.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Text("#${order.order_number}", fontWeight = FontWeight.Bold)
                                            Text("₹${order.total_amount.toInt()}", fontWeight = FontWeight.ExtraBold, color = MaterialTheme.colorScheme.primary)
                                        }
                                        Text(
                                            text = "${order.customers?.name ?: "Customer"} - ${order.customers?.phone ?: ""}",
                                            fontSize = 11.sp,
                                            color = Color.Gray
                                        )
                                        Text(
                                            text = "${order.order_items.size} items: " + order.order_items.joinToString(", ") {
                                                "${it.quantity}x ${it.food_items?.name ?: it.combos?.name ?: "Item"}"
                                            },
                                            fontSize = 11.sp,
                                            maxLines = 1
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
