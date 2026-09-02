package com.maduraifoodcorner.admin.ui.screens.orders

import android.widget.Toast
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.maduraifoodcorner.admin.data.model.Order
import com.maduraifoodcorner.admin.data.printer.BluetoothPrinterManager
import com.maduraifoodcorner.admin.data.repository.PrintRepository
import com.maduraifoodcorner.admin.ui.components.LoadingState
import com.maduraifoodcorner.admin.ui.components.OrderStatusBadge
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrderDetailsScreen(
    orderId: String,
    onBack: () -> Unit,
    viewModel: OrdersViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var order by remember { mutableStateOf<Order?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(orderId) {
        viewModel.getOrderDetails(orderId) { fetched ->
            order = fetched
            isLoading = false
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Order Details #${order?.order_number ?: ""}") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        if (isLoading) {
            LoadingState("Loading order details...")
        } else if (order == null) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("Order not found.")
            }
        } else {
            val o = order!!
            LazyColumn(
                modifier = Modifier
                    .padding(padding)
                    .fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Header Info Card
                item {
                    Card(
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "Order #${o.order_number}",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 18.sp
                                )
                                OrderStatusBadge(status = o.status)
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(text = "Date: ${o.created_at ?: o.required_date}", fontSize = 12.sp, color = Color.Gray)
                            Text(text = "Order Type: ${o.order_type} • Source: ${o.order_source}", fontSize = 12.sp, color = Color.Gray)
                            Text(text = "Payment: ${o.payment_method} (${o.payment_status})", fontSize = 12.sp, color = Color.Gray)
                        }
                    }
                }

                // Customer Info Card
                if (o.customers != null &&
                    !o.customers.name.isNullOrBlank() &&
                    o.customers.name.lowercase() !in listOf("counter customer", "test user", "walk-in", "guest") &&
                    o.customers.phone != "9999999999"
                ) {
                    item {
                        Card(
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text(text = "Customer Details", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(text = "Name: ${o.customers.name}", fontSize = 13.sp)
                                Text(text = "Phone: ${o.customers.phone}", fontSize = 13.sp)
                            }
                        }
                    }
                }

                // Order Line Items Header
                item {
                    Text(text = "Purchased Items", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                }

                // Items List
                items(o.order_items) { item ->
                    Card(
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = item.food_items?.name ?: item.combos?.name ?: "Food Item",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                                // Show category badge — highlight Snacks items
                                val category = item.food_items?.category
                                if (!category.isNullOrBlank()) {
                                    val isSnacks = category.equals("Snacks", ignoreCase = true)
                                    Text(
                                        text = if (isSnacks) "🍟 Snacks" else category,
                                        fontSize = 11.sp,
                                        color = if (isSnacks) Color(0xFFF57C00) else Color.Gray,
                                        fontWeight = if (isSnacks) FontWeight.Bold else FontWeight.Normal
                                    )
                                }
                                Text(
                                    text = "${item.quantity} x ₹${item.unit_price.toInt()}",
                                    fontSize = 12.sp,
                                    color = Color.Gray
                                )
                            }
                            Text(
                                text = "₹${item.line_total.toInt()}",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }

                // Thermal Receipt Print Button Section
                item {
                    Card(
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(text = "Grand Total", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                                Text(
                                    text = "₹${o.total_amount.toInt()}",
                                    fontWeight = FontWeight.ExtraBold,
                                    fontSize = 22.sp,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            // Print Bill / Reprint Bill Action Button
                            Button(
                                onClick = {
                                    scope.launch {
                                        val printRepo = PrintRepository(BluetoothPrinterManager(context))
                                        val ok = printRepo.printOrderReceipt(o)
                                        Toast.makeText(
                                            context,
                                            if (ok) "Thermal Receipt Printed Successfully!" else "Printer Connection Error",
                                            Toast.LENGTH_LONG
                                        ).show()
                                    }
                                },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(14.dp)
                            ) {
                                Icon(Icons.Default.Print, contentDescription = "Print")
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Reprint ESC/POS Bill", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}
