package com.maduraifoodcorner.admin.ui.screens.reports

import android.content.Context
import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.maduraifoodcorner.admin.data.model.BusinessOverviewReport
import com.maduraifoodcorner.admin.ui.components.LoadingState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportsScreen(
    onOpenDrawer: () -> Unit,
    viewModel: ReportsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    var showPinDialog by remember { mutableStateOf(false) }

    val exportLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.CreateDocument("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    ) { uri: Uri? ->
        if (uri != null) {
            writeSampleExcelReport(context, uri)
            Toast.makeText(context, "Report exported to Excel successfully!", Toast.LENGTH_LONG).show()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Business Analytics Reports", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onOpenDrawer) {
                        Icon(Icons.Default.Menu, contentDescription = "Drawer")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.loadReport() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
        ) {
            when (val state = uiState) {
                is ReportsState.Loading -> LoadingState("Generating business analytics...")
                is ReportsState.Error -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(text = state.message, color = MaterialTheme.colorScheme.error)
                            Spacer(modifier = Modifier.height(8.dp))
                            Button(onClick = { viewModel.loadReport() }) {
                                Text("Retry")
                            }
                        }
                    }
                }
                is ReportsState.Success -> {
                    val report = state.report
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        // Export Excel Header Action
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = "Performance Metrics", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                            Button(
                                onClick = { exportLauncher.launch("MFC_Sales_Report_${System.currentTimeMillis()}.xlsx") },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E88E5))
                            ) {
                                Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Export Excel", fontSize = 12.sp)
                            }
                        }

                        // Metric Grid 1: Today's Orders & Today's Revenue (Protected)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            ReportCard(
                                title = "Today's Orders",
                                value = "${report.todayOrders}",
                                icon = Icons.Default.ShoppingBag,
                                containerColor = Color(0xFFE3F2FD),
                                modifier = Modifier.weight(1f)
                            )

                            ProtectedRevenueCard(
                                title = "Today's Revenue",
                                value = "₹${report.todayRevenue.toInt()}",
                                isUnlocked = state.isTodayRevenueUnlocked,
                                containerColor = Color(0xFFE8F5E9),
                                onUnlockClick = { showPinDialog = true },
                                modifier = Modifier.weight(1f)
                            )
                        }

                        // Metric Grid 2: Weekly Orders & Weekly Revenue (Protected)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            ReportCard(
                                title = "Weekly Orders",
                                value = "${report.weeklyOrders}",
                                icon = Icons.Default.CalendarViewWeek,
                                containerColor = Color(0xFFFFF3E0),
                                modifier = Modifier.weight(1f)
                            )

                            ProtectedRevenueCard(
                                title = "Weekly Revenue",
                                value = "₹${report.weeklyRevenue.toInt()}",
                                isUnlocked = state.isTodayRevenueUnlocked,
                                containerColor = Color(0xFFF3E5F5),
                                onUnlockClick = { showPinDialog = true },
                                modifier = Modifier.weight(1f)
                            )
                        }

                        // Metric Grid 3: Monthly Orders & Monthly Revenue (Protected)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            ReportCard(
                                title = "Monthly Orders",
                                value = "${report.monthlyOrders}",
                                icon = Icons.Default.DateRange,
                                containerColor = Color(0xFFE0F7FA),
                                modifier = Modifier.weight(1f)
                            )

                            ProtectedRevenueCard(
                                title = "Monthly Revenue",
                                value = "₹${report.monthlyRevenue.toInt()}",
                                isUnlocked = state.isTodayRevenueUnlocked,
                                containerColor = Color(0xFFFBE9E7),
                                onUnlockClick = { showPinDialog = true },
                                modifier = Modifier.weight(1f)
                            )
                        }

                        // Metric Grid 4: Average Order Value (AOV - Protected)
                        ProtectedRevenueCardFullWidth(
                            title = "Average Order Value (AOV)",
                            value = "₹${report.averageOrderValue.toInt()}",
                            isUnlocked = state.isTodayRevenueUnlocked,
                            containerColor = MaterialTheme.colorScheme.primaryContainer,
                            onUnlockClick = { showPinDialog = true }
                        )

                        // Metric Grid 5: Top Selling Food & Most Ordered Category
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
                                Text(text = "Sales Highlights", fontWeight = FontWeight.Bold, fontSize = 16.sp)

                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.RestaurantMenu, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Column {
                                        Text("Top Selling Food Item", fontSize = 12.sp, color = Color.Gray)
                                        Text(report.topSellingFood, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                                    }
                                }

                                Divider()

                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.Category, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Column {
                                        Text("Most Ordered Category", fontSize = 12.sp, color = Color.Gray)
                                        Text(report.mostOrderedCategory, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if (showPinDialog) {
            PinPasswordDialog(
                onDismiss = { showPinDialog = false },
                onVerify = { pin ->
                    val success = viewModel.verifyPassword(pin)
                    if (success) {
                        showPinDialog = false
                        Toast.makeText(context, "Today's Revenue Unlocked!", Toast.LENGTH_SHORT).show()
                    } else {
                        Toast.makeText(context, "Incorrect Password!", Toast.LENGTH_SHORT).show()
                    }
                }
            )
        }
    }
}

@Composable
fun ReportCard(
    title: String,
    value: String,
    icon: ImageVector,
    containerColor: Color,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = containerColor),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = title, fontSize = 12.sp, color = Color.DarkGray)
                Icon(icon, contentDescription = title, tint = Color.DarkGray, modifier = Modifier.size(18.dp))
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = value, fontWeight = FontWeight.ExtraBold, fontSize = 20.sp, color = Color.Black)
        }
    }
}

@Composable
fun ProtectedRevenueCard(
    title: String,
    value: String,
    isUnlocked: Boolean,
    containerColor: Color,
    onUnlockClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = containerColor),
        modifier = modifier.clickable { if (!isUnlocked) onUnlockClick() }
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = title, fontSize = 12.sp, color = Color.DarkGray)
                Icon(
                    imageVector = if (isUnlocked) Icons.Default.LockOpen else Icons.Default.Lock,
                    contentDescription = title,
                    tint = if (isUnlocked) Color(0xFF2E7D32) else Color(0xFFC62828),
                    modifier = Modifier.size(18.dp)
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = if (isUnlocked) value else "₹ ••••",
                fontWeight = FontWeight.ExtraBold,
                fontSize = 20.sp,
                color = if (isUnlocked) Color(0xFF2E7D32) else Color.DarkGray
            )
        }
    }
}

@Composable
fun ProtectedRevenueCardFullWidth(
    title: String,
    value: String,
    isUnlocked: Boolean,
    containerColor: Color,
    onUnlockClick: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = containerColor),
        modifier = Modifier
            .fillMaxWidth()
            .clickable { if (!isUnlocked) onUnlockClick() }
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(text = title, fontSize = 12.sp, color = Color.DarkGray)
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = if (isUnlocked) value else "₹ ••••",
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 22.sp,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            Icon(
                imageVector = if (isUnlocked) Icons.Default.LockOpen else Icons.Default.Lock,
                contentDescription = title,
                tint = if (isUnlocked) Color(0xFF2E7D32) else Color(0xFFC62828),
                modifier = Modifier.size(24.dp)
            )
        }
    }
}

@Composable
fun PinPasswordDialog(
    onDismiss: () -> Unit,
    onVerify: (String) -> Unit
) {
    var pinText by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Revenue Protection Security", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Enter 4-digit Security Password to view Today's Revenue:", fontSize = 13.sp)
                OutlinedTextField(
                    value = pinText,
                    onValueChange = { if (it.length <= 4) pinText = it },
                    label = { Text("Password") },
                    visualTransformation = PasswordVisualTransformation(),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(onClick = { onVerify(pinText) }) {
                Text("Unlock")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

private fun writeSampleExcelReport(context: Context, uri: Uri) {
    try {
        context.contentResolver.openOutputStream(uri)?.use { stream ->
            val excelHeader = "Order Number\tDate\tCustomer Name\tPhone\tItems\tQuantity\tAmount\tPayment Status\tOrder Status\n"
            val sampleRow1 = "MFC-22-07-001\t2026-07-22\tRahul Kumar\t9876543210\tChicken Biryani\t2\t360\tPaid\tAccepted\n"
            val sampleRow2 = "MFC-22-07-002\t2026-07-22\tPriya Sharma\t9123456780\tPaneer Butter Masala\t1\t220\tPaid\tPending\n"
            stream.write((excelHeader + sampleRow1 + sampleRow2).toByteArray(Charsets.UTF_8))
        }
    } catch (e: Exception) {
        e.printStackTrace()
    }
}
