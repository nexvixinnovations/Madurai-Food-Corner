package com.maduraifoodcorner.admin.ui.screens.billing

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.maduraifoodcorner.admin.data.model.Order
import com.maduraifoodcorner.admin.data.printer.BluetoothPrinterManager
import com.maduraifoodcorner.admin.data.repository.PrintRepository
import com.maduraifoodcorner.admin.ui.components.LoadingState
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BillingScreen(
    onOpenDrawer: () -> Unit,
    viewModel: BillingViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val cartItems by viewModel.cartItems.collectAsState()
    val settings by viewModel.settings.collectAsState()
    val isSubmitting by viewModel.isSubmittingOrder.collectAsState()
    val discountBreakdown by viewModel.discountBreakdown.collectAsState()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var selectedCategory by remember { mutableStateOf("All") }
    var searchQuery by remember { mutableStateOf("") }
    var showOrderPickerSheet by remember { mutableStateOf(false) }

    // Use the live discount breakdown from ViewModel (offer-aware)
    val eligibleSubtotal = discountBreakdown.eligibleSubtotal
    val specialOfferSubtotal = discountBreakdown.specialOfferSubtotal
    val discountPct = discountBreakdown.discountPercent.toInt()
    val discountAmt = discountBreakdown.discountAmount
    val grandTotal = discountBreakdown.grandTotal
    val subtotal = discountBreakdown.eligibleSubtotal + discountBreakdown.specialOfferSubtotal

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Counter POS Billing", fontWeight = FontWeight.Bold) },
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
            when (val state = uiState) {
                is BillingState.Idle, is BillingState.Loading -> LoadingState("Loading POS Catalog & Orders...")
                is BillingState.Error -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(text = state.message, color = MaterialTheme.colorScheme.error)
                            Spacer(modifier = Modifier.height(8.dp))
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

                            Divider(modifier = Modifier.fillMaxHeight().width(1.dp))

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

                                Spacer(modifier = Modifier.height(4.dp))

                                // ─── Order Value Discount Breakdown ──────────────────
                                Surface(
                                    color = MaterialTheme.colorScheme.surfaceVariant,
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                        // Eligible items line (food + combo)
                                        if (eligibleSubtotal > 0) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween
                                            ) {
                                                Text("Regular & Combo:", fontSize = 12.sp, color = Color.Gray)
                                                Text("₹${"%.2f".format(eligibleSubtotal)}", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                            }
                                        }

                                        // Special offer items line (if any)
                                        if (specialOfferSubtotal > 0) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween
                                            ) {
                                                Text("Special Offers:", fontSize = 12.sp, color = Color.Gray)
                                                Text("₹${"%.2f".format(specialOfferSubtotal)}", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Color(0xFFE65100))
                                            }
                                        }

                                        // Discount line (only shown when applicable)
                                        if (discountPct > 0 && discountAmt > 0) {
                                            Divider(modifier = Modifier.padding(vertical = 2.dp))
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween
                                            ) {
                                                Text("Order Discount ($discountPct%):", fontSize = 12.sp, color = Color(0xFF2E7D32), fontWeight = FontWeight.Bold)
                                                Text("-₹${"%.2f".format(discountAmt)}", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Color(0xFF2E7D32))
                                            }
                                            Text(
                                                text = "Applies to Regular & Combo items only. Special Offers excluded.",
                                                fontSize = 9.sp, color = Color.Gray
                                            )
                                        }

                                        Divider(modifier = Modifier.padding(vertical = 2.dp))

                                        // Grand Total
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Text("GRAND TOTAL:", fontWeight = FontWeight.ExtraBold, fontSize = 14.sp)
                                            Text("₹${"%.2f".format(grandTotal)}", fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, color = MaterialTheme.colorScheme.primary)
                                        }

                                        Spacer(modifier = Modifier.height(6.dp))

                                        Button(
                                            onClick = {
                                                viewModel.generatePosOrder(
                                                    onSuccess = { createdOrder ->
                                                        Toast.makeText(context, "Order #${createdOrder.order_number} Saved & Printed!", Toast.LENGTH_LONG).show()
                                                        // Automatically trigger thermal printer receipt upon submission
                                                        scope.launch {
                                                            try {
                                                                val printRepo = PrintRepository(BluetoothPrinterManager(context))
                                                                printRepo.printOrderReceipt(createdOrder)
                                                            } catch (e: Exception) {
                                                                // Silent catch so print issues don't crash UI
                                                            }
                                                        }
                                                    },
                                                    onError = { err ->
                                                        Toast.makeText(context, err, Toast.LENGTH_SHORT).show()
                                                    }
                                                )
                                            },
                                            enabled = cartItems.isNotEmpty() && !isSubmitting,
                                            shape = RoundedCornerShape(8.dp),
                                            modifier = Modifier.fillMaxWidth()
                                        ) {
                                            if (isSubmitting) {
                                                CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White)
                                            } else {
                                                Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(16.dp))
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text("Submit POS Order", fontSize = 11.sp)
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

        if (showOrderPickerSheet && uiState is BillingState.Success) {
            val pendingOrders = (uiState as BillingState.Success).pendingWebsiteOrders
            AlertDialog(
                onDismissRequest = { showOrderPickerSheet = false },
                title = { Text("Load Website Orders", fontWeight = FontWeight.Bold) },
                text = {
                    if (pendingOrders.isEmpty()) {
                        Text("No pending website orders found to load.")
                    } else {
                        LazyColumn(
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.heightIn(max = 300.dp)
                        ) {
                            items(pendingOrders) { order ->
                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable {
                                            viewModel.loadWebsiteOrderToCart(order)
                                            showOrderPickerSheet = false
                                            Toast.makeText(context, "Loaded order #${order.order_number} to cart", Toast.LENGTH_SHORT).show()
                                        }
                                ) {
                                    Column(modifier = Modifier.padding(10.dp)) {
                                        Text("#${order.order_number} • ${order.order_type}", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                        Text("Customer: ${order.customers?.name ?: "Guest"} (${order.customers?.phone ?: ""})", fontSize = 11.sp, color = Color.Gray)
                                        Text("Total: ₹${order.total_amount.toInt()}", fontWeight = FontWeight.ExtraBold, fontSize = 12.sp, color = MaterialTheme.colorScheme.primary)
                                    }
                                }
                            }
                        }
                    }
                },
                confirmButton = {
                    TextButton(onClick = { showOrderPickerSheet = false }) {
                        Text("Close")
                    }
                }
            )
        }
    }
}
