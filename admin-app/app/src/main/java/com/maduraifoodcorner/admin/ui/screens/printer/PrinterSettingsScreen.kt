package com.maduraifoodcorner.admin.ui.screens.printer

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import com.maduraifoodcorner.admin.data.printer.PrinterState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PrinterSettingsScreen(
    onOpenDrawer: () -> Unit,
    viewModel: PrinterViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val pairedDevices by viewModel.pairedDevices.collectAsState()
    val printerState by viewModel.printerState.collectAsState()
    val statusMessage by viewModel.statusMessage.collectAsState()

    var hasBluetoothPermission by remember {
        mutableStateOf(checkBluetoothPermissions(context))
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissionsMap ->
        val allGranted = permissionsMap.values.all { it }
        hasBluetoothPermission = allGranted
        if (allGranted) {
            viewModel.refreshDevices()
        }
    }

    LaunchedEffect(Unit) {
        if (!hasBluetoothPermission) {
            permissionLauncher.launch(getRequiredBluetoothPermissions())
        }
    }

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
                    IconButton(onClick = {
                        hasBluetoothPermission = checkBluetoothPermissions(context)
                        if (hasBluetoothPermission) {
                            viewModel.refreshDevices()
                        } else {
                            permissionLauncher.launch(getRequiredBluetoothPermissions())
                        }
                    }) {
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
            // Bluetooth Permission Warning Card if not granted
            if (!hasBluetoothPermission) {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF3E0))
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.Default.Warning,
                                contentDescription = null,
                                tint = Color(0xFFE65100),
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Bluetooth Permission Needed",
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp,
                                color = Color(0xFFE65100)
                            )
                        }
                        Text(
                            text = "To find and connect to ESC/POS thermal printers, please allow Nearby Devices / Bluetooth permission.",
                            fontSize = 13.sp,
                            color = Color(0xFF5D4037)
                        )
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Button(
                                onClick = {
                                    permissionLauncher.launch(getRequiredBluetoothPermissions())
                                },
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("Grant Permission", fontSize = 12.sp)
                            }
                            OutlinedButton(
                                onClick = {
                                    val intent = Intent(
                                        Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                                        Uri.fromParts("package", context.packageName, null)
                                    )
                                    context.startActivity(intent)
                                },
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("App Settings", fontSize = 12.sp)
                            }
                        }
                    }
                }
            }

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
                            onClick = {
                                if (hasBluetoothPermission) {
                                    viewModel.connectPrinter(device)
                                } else {
                                    permissionLauncher.launch(getRequiredBluetoothPermissions())
                                }
                            },
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
                                Column(modifier = Modifier.weight(1f)) {
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
                                    onClick = {
                                        if (hasBluetoothPermission) {
                                            viewModel.connectPrinter(device)
                                        } else {
                                            permissionLauncher.launch(getRequiredBluetoothPermissions())
                                        }
                                    },
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

private fun getRequiredBluetoothPermissions(): Array<String> {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        arrayOf(
            Manifest.permission.BLUETOOTH_CONNECT,
            Manifest.permission.BLUETOOTH_SCAN
        )
    } else {
        arrayOf(
            Manifest.permission.BLUETOOTH,
            Manifest.permission.BLUETOOTH_ADMIN,
            Manifest.permission.ACCESS_FINE_LOCATION
        )
    }
}

private fun checkBluetoothPermissions(context: Context): Boolean {
    val permissions = getRequiredBluetoothPermissions()
    return permissions.all {
        ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED
    }
}
