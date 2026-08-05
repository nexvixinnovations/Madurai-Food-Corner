package com.maduraifoodcorner.admin.ui.screens.printer

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
import com.maduraifoodcorner.admin.data.printer.PrinterState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PrinterSettingsScreen(
    onOpenDrawer: () -> Unit,
    viewModel: PrinterViewModel = hiltViewModel()
) {
    val pairedDevices by viewModel.pairedDevices.collectAsState()
    val printerState by viewModel.printerState.collectAsState()
    val statusMessage by viewModel.statusMessage.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("ESC/POS Printer Settings", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onOpenDrawer) {
                        Icon(Icons.Default.Menu, contentDescription = "Drawer")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.refreshDevices() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Scan Printers")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Status Connection Banner
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(
                    containerColor = when (printerState) {
                        PrinterState.Connected -> Color(0xFFE8F5E9)
                        PrinterState.Connecting -> Color(0xFFFFF3E0)
                        PrinterState.Failed -> Color(0xFFFFEBEE)
                        else -> MaterialTheme.colorScheme.surface
                    }
                )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = when (printerState) {
                            PrinterState.Connected -> Icons.Default.CheckCircle
                            PrinterState.Printing -> Icons.Default.Print
                            else -> Icons.Default.BluetoothSearching
                        },
                        contentDescription = null,
                        tint = when (printerState) {
                            PrinterState.Connected -> Color(0xFF2E7D32)
                            PrinterState.Failed -> Color(0xFFC62828)
                            else -> MaterialTheme.colorScheme.primary
                        },
                        modifier = Modifier.size(32.dp)
                    )
                    Spacer(modifier = Modifier.width(16.dp))
                    Column {
                        Text(
                            text = "Status: ${printerState.name}",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                        Text(
                            text = statusMessage,
                            fontSize = 12.sp,
                            color = Color.Gray
                        )
                    }
                }
            }

            // Test Print Action Card
            Button(
                onClick = { viewModel.printTestReceipt() },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                enabled = printerState == PrinterState.Connected
            ) {
                Icon(Icons.Default.Print, contentDescription = "Test Print")
                Spacer(modifier = Modifier.width(8.dp))
                Text("Print Test Receipt (58mm)")
            }

            Text(
                text = "Paired Bluetooth Devices",
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp
            )

            if (pairedDevices.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No paired Bluetooth printers found.\nPlease pair your 58mm Thermal Printer in Android System Settings.",
                        color = Color.Gray,
                        fontSize = 13.sp
                    )
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(pairedDevices) { device ->
                        Card(
                            onClick = { viewModel.connectPrinter(device) },
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
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
                                        text = device.name,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp
                                    )
                                    Text(
                                        text = device.address,
                                        fontSize = 12.sp,
                                        color = Color.Gray
                                    )
                                }

                                Button(
                                    onClick = { viewModel.connectPrinter(device) },
                                    shape = RoundedCornerShape(10.dp)
                                ) {
                                    Text("Connect")
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
