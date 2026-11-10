package com.maduraifoodcorner.admin.ui.screens.special

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.maduraifoodcorner.admin.data.model.FoodItem
import com.maduraifoodcorner.admin.data.model.SpecialOrder
import com.maduraifoodcorner.admin.data.model.SpecialOrderItem

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SpecialOrdersScreen(
    onOpenDrawer: () -> Unit,
    viewModel: SpecialOrdersViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    var selectedTab by remember { mutableStateOf(0) } // 0: Create, 1: Storage History

    val customerName by viewModel.customerName.collectAsState()
    val customerPhone by viewModel.customerPhone.collectAsState()
    val orderNumber by viewModel.orderNumber.collectAsState()
    val eventDate by viewModel.eventDate.collectAsState()
    val advancePaidText by viewModel.advancePaidText.collectAsState()
    val selectedItems by viewModel.selectedItems.collectAsState()
    val availableFoods by viewModel.availableFoods.collectAsState()
    val storedOrders by viewModel.storedOrders.collectAsState()
    val isGeneratingPdf by viewModel.isGeneratingPdf.collectAsState()

    var showFoodPickerDialog by remember { mutableStateOf(false) }
    var showCustomItemDialog by remember { mutableStateOf(false) }

    val subtotal = selectedItems.sumOf { it.lineTotal }
    val advance = advancePaidText.toDoubleOrNull() ?: 0.0
    val totalAmount = subtotal
    val balanceDue = (totalAmount - advance).coerceAtLeast(0.0)

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Special Bulk Orders", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Text("Catering, Parties & Bulk Invoices", fontSize = 11.sp, color = Color.Gray)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onOpenDrawer) {
                        Icon(Icons.Default.Menu, contentDescription = "Open Menu")
                    }
                },
                actions = {
                    if (selectedTab == 0) {
                        IconButton(onClick = { viewModel.clearForm() }) {
                            Icon(Icons.Default.ClearAll, contentDescription = "Clear Form")
                        }
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Tab Header
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = MaterialTheme.colorScheme.surface
            ) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.AddCircleOutline, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("New Special Order", fontWeight = if (selectedTab == 0) FontWeight.Bold else FontWeight.Normal)
                        }
                    }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Inventory2, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Stored Orders (${storedOrders.size})", fontWeight = if (selectedTab == 1) FontWeight.Bold else FontWeight.Normal)
                        }
                    }
                )
            }

            if (selectedTab == 0) {
                // ─── TAB 0: NEW SPECIAL ORDER FORM ───
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Customer & Order Details Card
                    item {
                        Card(
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text("Customer & Order Details", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                    Badge(containerColor = MaterialTheme.colorScheme.primaryContainer) {
                                        Text("Auto Numbered", fontSize = 10.sp, modifier = Modifier.padding(2.dp))
                                    }
                                }

                                OutlinedTextField(
                                    value = orderNumber,
                                    onValueChange = {},
                                    readOnly = true,
                                    label = { Text("Order Number (Filled Automatically)") },
                                    trailingIcon = {
                                        IconButton(onClick = { viewModel.generateNewOrderNumber() }) {
                                            Icon(Icons.Default.Refresh, contentDescription = "Regenerate Order Number")
                                        }
                                    },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedContainerColor = MaterialTheme.colorScheme.surface,
                                        unfocusedContainerColor = MaterialTheme.colorScheme.surface
                                    )
                                )

                                OutlinedTextField(
                                    value = customerName,
                                    onValueChange = { viewModel.setCustomerName(it) },
                                    label = { Text("Customer Name *") },
                                    placeholder = { Text("e.g. Ramesh Catering") },
                                    leadingIcon = { Icon(Icons.Default.Person, contentDescription = null) },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth()
                                )

                                OutlinedTextField(
                                    value = customerPhone,
                                    onValueChange = { viewModel.setCustomerPhone(it) },
                                    label = { Text("Phone Number *") },
                                    placeholder = { Text("e.g. 9876543210") },
                                    leadingIcon = { Icon(Icons.Default.Phone, contentDescription = null) },
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth()
                                )

                                OutlinedTextField(
                                    value = eventDate,
                                    onValueChange = { viewModel.setEventDate(it) },
                                    label = { Text("Event / Delivery Date") },
                                    placeholder = { Text("e.g. 15-Nov-2026") },
                                    leadingIcon = { Icon(Icons.Default.CalendarToday, contentDescription = null) },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth()
                                )
                            }
                        }
                    }

                    // Bulk Food Items Header & Add Actions
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Bulk Food Items (${selectedItems.size})", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Button(
                                    onClick = { showFoodPickerDialog = true },
                                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                                ) {
                                    Icon(Icons.Default.RestaurantMenu, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("+ Menu Item", fontSize = 12.sp)
                                }
                                OutlinedButton(
                                    onClick = { showCustomItemDialog = true },
                                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                                ) {
                                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Custom", fontSize = 12.sp)
                                }
                            }
                        }
                    }

                    if (selectedItems.isEmpty()) {
                        item {
                            Card(
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(28.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Icon(Icons.Default.Fastfood, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(40.dp))
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Text("No items added for this bulk order yet.", color = Color.Gray, fontSize = 13.sp)
                                        Text("Tap '+ Menu Item' or 'Custom' to add foods with custom prices.", color = Color.Gray, fontSize = 11.sp)
                                    }
                                }
                            }
                        }
                    } else {
                        items(selectedItems, key = { it.id }) { item ->
                            SpecialOrderItemRow(
                                item = item,
                                onUpdatePrice = { newPrice -> viewModel.updateItemPrice(item.id, newPrice) },
                                onUpdateQuantity = { newQty -> viewModel.updateItemQuantity(item.id, newQty) },
                                onRemove = { viewModel.removeItem(item.id) }
                            )
                        }
                    }

                    // Financial Summary & Balance Card
                    item {
                        Card(
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Text("Invoice & Balance Breakdown", fontWeight = FontWeight.Bold, fontSize = 15.sp)

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text("Subtotal:", fontSize = 13.sp, color = Color.Gray)
                                    Text("Rs. ${"%.2f".format(subtotal)}", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                                }

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text("TOTAL AMOUNT:", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                    Text("Rs. ${"%.2f".format(totalAmount)}", fontWeight = FontWeight.ExtraBold, fontSize = 17.sp)
                                }

                                HorizontalDivider()

                                OutlinedTextField(
                                    value = advancePaidText,
                                    onValueChange = { viewModel.setAdvancePaid(it) },
                                    label = { Text("Advance Amount Paid (Rs.)") },
                                    placeholder = { Text("0.00") },
                                    leadingIcon = { Text("Rs.", fontWeight = FontWeight.Bold, modifier = Modifier.padding(start = 12.dp)) },
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth()
                                )

                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(if (balanceDue <= 0.0) Color(0xFFE8F5E9) else Color(0xFFFFEBEE))
                                        .padding(12.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(
                                            text = if (balanceDue <= 0.0) "FULLY PAID" else "BALANCE DUE DETAILS",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp,
                                            color = if (balanceDue <= 0.0) Color(0xFF2E7D32) else Color(0xFFC62828)
                                        )
                                        Text(
                                            text = if (balanceDue <= 0.0) "No outstanding balance" else "To collect upon delivery/event",
                                            fontSize = 11.sp,
                                            color = Color.DarkGray
                                        )
                                    }
                                    Text(
                                        text = "Rs. ${"%.2f".format(balanceDue)}",
                                        fontWeight = FontWeight.ExtraBold,
                                        fontSize = 18.sp,
                                        color = if (balanceDue <= 0.0) Color(0xFF2E7D32) else Color(0xFFC62828)
                                    )
                                }

                                Spacer(modifier = Modifier.height(4.dp))

                                Button(
                                    onClick = {
                                        viewModel.saveSpecialOrderAndCreatePdf(
                                            onSuccess = { savedOrder, pdfFile ->
                                                Toast.makeText(context, "Special Order ${savedOrder.orderNumber} saved to storage!", Toast.LENGTH_SHORT).show()
                                                // Automatically open the generated PDF invoice
                                                viewModel.openPdf(context, savedOrder)
                                            },
                                            onError = { err ->
                                                Toast.makeText(context, err, Toast.LENGTH_LONG).show()
                                            }
                                        )
                                    },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                                    enabled = !isGeneratingPdf && selectedItems.isNotEmpty()
                                ) {
                                    if (isGeneratingPdf) {
                                        CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White)
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text("Generating Invoice PDF...")
                                    } else {
                                        Icon(Icons.Default.PictureAsPdf, contentDescription = null)
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text("Save Order & Generate PDF Invoice", fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                // ─── TAB 1: STORED ORDERS & INVOICES ───
                if (storedOrders.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Default.Inventory2, contentDescription = null, tint = Color.LightGray, modifier = Modifier.size(56.dp))
                            Spacer(modifier = Modifier.height(12.dp))
                            Text("No Special Orders in Storage Yet", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            Text("Orders created in the 'New Special Order' tab will be permanently stored here.", color = Color.Gray, fontSize = 12.sp)
                        }
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        items(storedOrders, key = { it.id }) { order ->
                            StoredSpecialOrderCard(
                                order = order,
                                onOpenPdf = { viewModel.openPdf(context, order) },
                                onSharePdf = { viewModel.sharePdf(context, order) },
                                onDelete = { viewModel.deleteStoredOrder(order.id) }
                            )
                        }
                    }
                }
            }
        }
    }

    // Dialog: Select Food from Menu
    if (showFoodPickerDialog) {
        AlertDialog(
            onDismissRequest = { showFoodPickerDialog = false },
            title = { Text("Select Food from Catalog", fontWeight = FontWeight.Bold) },
            text = {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(350.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(availableFoods) { food ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                            modifier = Modifier.fillMaxWidth(),
                            onClick = {
                                viewModel.addFoodItem(food, defaultQty = 10)
                                showFoodPickerDialog = false
                                Toast.makeText(context, "Added ${food.name} (10 portions). You can adjust bulk price/qty.", Toast.LENGTH_SHORT).show()
                            }
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(food.name, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    Text(food.category, fontSize = 11.sp, color = Color.Gray)
                                }
                                Text("Rs. ${food.price}", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary, fontSize = 14.sp)
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showFoodPickerDialog = false }) {
                    Text("Close")
                }
            }
        )
    }

    // Dialog: Add Custom Catering Item
    if (showCustomItemDialog) {
        var customName by remember { mutableStateOf("") }
        var customQty by remember { mutableStateOf("25") }
        var customPrice by remember { mutableStateOf("100") }

        AlertDialog(
            onDismissRequest = { showCustomItemDialog = false },
            title = { Text("Add Custom Catering Item", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = customName,
                        onValueChange = { customName = it },
                        label = { Text("Item Name (e.g. Mutton Chukka Bulk)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = customQty,
                        onValueChange = { customQty = it },
                        label = { Text("Bulk Quantity (Portions)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = customPrice,
                        onValueChange = { customPrice = it },
                        label = { Text("Custom Price per Unit (Rs.)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val qty = customQty.toIntOrNull() ?: 1
                        val price = customPrice.toDoubleOrNull() ?: 0.0
                        viewModel.addCustomCateringItem(customName, qty, price)
                        showCustomItemDialog = false
                    }
                ) {
                    Text("Add Item")
                }
            },
            dismissButton = {
                TextButton(onClick = { showCustomItemDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

/**
 * Item row displaying bulk quantity, food info, line total,
 * AND the EDITING OPTION for the price of all foods displayed there!
 */
@Composable
fun SpecialOrderItemRow(
    item: SpecialOrderItem,
    onUpdatePrice: (Double) -> Unit,
    onUpdateQuantity: (Int) -> Unit,
    onRemove: () -> Unit
) {
    var priceText by remember(item.unitPrice) { mutableStateOf(item.unitPrice.toString()) }
    var qtyText by remember(item.quantity) { mutableStateOf(item.quantity.toString()) }

    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Header: Name & Remove
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(item.foodName, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(item.category, fontSize = 11.sp, color = Color.Gray)
                        if (item.standardPrice > 0) {
                            Text(" • Standard: Rs. ${item.standardPrice}", fontSize = 11.sp, color = Color.DarkGray)
                        }
                    }
                }
                IconButton(onClick = onRemove, modifier = Modifier.size(28.dp)) {
                    Icon(Icons.Default.Delete, contentDescription = "Remove", tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(20.dp))
                }
            }

            // Editable Quantity & Editable Custom Unit Price Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Bulk Quantity Field
                OutlinedTextField(
                    value = qtyText,
                    onValueChange = {
                        qtyText = it
                        val newQty = it.toIntOrNull()
                        if (newQty != null) {
                            onUpdateQuantity(newQty)
                        }
                    },
                    label = { Text("Qty (Bulk)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.weight(1f)
                )

                // Editable Unit Price Field (Required: "there should be the editing option for the price of all foods displayd there")
                OutlinedTextField(
                    value = priceText,
                    onValueChange = {
                        priceText = it
                        val newPrice = it.toDoubleOrNull()
                        if (newPrice != null) {
                            onUpdatePrice(newPrice)
                        }
                    },
                    label = { Text("Custom Price (Rs.) ✏️") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.weight(1.3f),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = MaterialTheme.colorScheme.primary,
                        unfocusedBorderColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.5f)
                    )
                )
            }

            // Calculated Line Total Display
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${item.quantity} portions × Rs. ${"%.2f".format(item.unitPrice)}",
                    fontSize = 12.sp,
                    color = Color.Gray
                )
                Text(
                    text = "Total: Rs. ${"%.2f".format(item.lineTotal)}",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

/**
 * Card for an existing Special Order stored in device storage.
 */
@Composable
fun StoredSpecialOrderCard(
    order: SpecialOrder,
    onOpenPdf: () -> Unit,
    onSharePdf: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Order No and Status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(order.orderNumber, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = MaterialTheme.colorScheme.primary)
                    Text(order.createdAtFormatted, fontSize = 11.sp, color = Color.Gray)
                }
                val isPaid = order.balanceAmount <= 0.0
                Badge(
                    containerColor = if (isPaid) Color(0xFFE8F5E9) else Color(0xFFFFEBEE)
                ) {
                    Text(
                        text = if (isPaid) "PAID" else "BAL: Rs. ${order.balanceAmount.toInt()}",
                        color = if (isPaid) Color(0xFF2E7D32) else Color(0xFFC62828),
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        modifier = Modifier.padding(4.dp)
                    )
                }
            }

            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))

            // Customer Info
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Customer: ${order.customerName}", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                    Text("Phone: ${order.customerPhone}", fontSize = 12.sp, color = Color.DarkGray)
                }
                if (order.eventDate.isNotBlank()) {
                    Text("Event: ${order.eventDate}", fontSize = 12.sp, color = Color.Gray)
                }
            }

            // Items summary preview
            Text(
                text = "${order.items.size} bulk food item(s): " + order.items.joinToString(", ") { "${it.foodName} (${it.quantity})" },
                fontSize = 12.sp,
                color = Color.DarkGray,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )

            // Financial breakdown
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                    .padding(8.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Total Amount", fontSize = 10.sp, color = Color.Gray)
                    Text("Rs. ${"%.2f".format(order.totalAmount)}", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
                Column {
                    Text("Advance Paid", fontSize = 10.sp, color = Color.Gray)
                    Text("Rs. ${"%.2f".format(order.advancePaid)}", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color(0xFF2E7D32))
                }
                Column {
                    Text("Balance Due", fontSize = 10.sp, color = Color.Gray)
                    Text(
                        "Rs. ${"%.2f".format(order.balanceAmount)}",
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        color = if (order.balanceAmount <= 0) Color(0xFF2E7D32) else Color(0xFFC62828)
                    )
                }
            }

            // Actions: PDF View, Share, Delete
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Button(
                    onClick = onOpenPdf,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Icon(Icons.Default.PictureAsPdf, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("View PDF", fontSize = 12.sp)
                }

                OutlinedButton(
                    onClick = onSharePdf,
                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Share", fontSize = 12.sp)
                }

                IconButton(onClick = onDelete) {
                    Icon(Icons.Default.DeleteOutline, contentDescription = "Delete", tint = MaterialTheme.colorScheme.error)
                }
            }
        }
    }
}
