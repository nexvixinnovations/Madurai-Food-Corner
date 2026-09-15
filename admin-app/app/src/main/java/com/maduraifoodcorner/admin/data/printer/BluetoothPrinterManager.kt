package com.maduraifoodcorner.admin.data.printer

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.io.OutputStream
import java.util.*

enum class PrinterState {
    Disconnected,
    Connecting,
    Connected,
    Printing,
    Failed
}

data class BluetoothPrinterDevice(
    val name: String,
    val address: String
)

class BluetoothPrinterManager(private val context: Context) {

    private val bluetoothAdapter: BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter()
    private val prefs = PrinterPreferences(context)
    private var socket: BluetoothSocket? = null
    private var outputStream: OutputStream? = null
    private val printMutex = Mutex()

    private val _printerState = MutableStateFlow(PrinterState.Disconnected)
    val printerState: StateFlow<PrinterState> = _printerState

    private val _statusMessage = MutableStateFlow("Disconnected")
    val statusMessage: StateFlow<String> = _statusMessage

    @SuppressLint("MissingPermission")
    fun getPairedPrinters(): List<BluetoothPrinterDevice> {
        return try {
            if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled) {
                return emptyList()
            }
            bluetoothAdapter.bondedDevices?.map { device ->
                BluetoothPrinterDevice(
                    name = device.name ?: "Unknown Device",
                    address = device.address
                )
            } ?: emptyList()
        } catch (e: SecurityException) {
            _statusMessage.value = "Bluetooth permission required"
            emptyList()
        } catch (e: Exception) {
            _statusMessage.value = "Error reading paired devices: ${e.localizedMessage}"
            emptyList()
        }
    }

    private fun closeActiveSocket() {
        try {
            outputStream?.flush()
        } catch (ignored: Exception) {}
        try {
            outputStream?.close()
        } catch (ignored: Exception) {}
        try {
            socket?.close()
        } catch (ignored: Exception) {}
        outputStream = null
        socket = null
    }

    @SuppressLint("MissingPermission")
    suspend fun connectPrinter(macAddress: String): Boolean = withContext(Dispatchers.IO) {
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled) {
            _printerState.value = PrinterState.Failed
            _statusMessage.value = "Bluetooth is disabled"
            return@withContext false
        }

        try {
            _printerState.value = PrinterState.Connecting
            _statusMessage.value = "Connecting to $macAddress..."

            // Cancel discovery as it heavily degrades connection speed & causes RFCOMM timeout
            try {
                bluetoothAdapter.cancelDiscovery()
            } catch (ignored: Exception) {}

            closeActiveSocket()

            val device: BluetoothDevice = bluetoothAdapter.getRemoteDevice(macAddress)
            val uuid = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB") // Standard SPP UUID

            var connectedSocket: BluetoothSocket? = null

            // Method 1: Standard RFCOMM SPP
            try {
                val s = device.createRfcommSocketToServiceRecord(uuid)
                s.connect()
                connectedSocket = s
            } catch (e1: Exception) {
                // Method 2: Insecure RFCOMM
                try {
                    val s = device.createInsecureRfcommSocketToServiceRecord(uuid)
                    s.connect()
                    connectedSocket = s
                } catch (e2: Exception) {
                    // Method 3: Reflection fallback (Channel 1)
                    val method = device.javaClass.getMethod("createRfcommSocket", Int::class.javaPrimitiveType)
                    val s = method.invoke(device, 1) as BluetoothSocket
                    s.connect()
                    connectedSocket = s
                }
            }

            if (connectedSocket != null && connectedSocket.isConnected) {
                socket = connectedSocket
                outputStream = connectedSocket.outputStream
                prefs.setSelectedPrinterAddress(macAddress)
                _printerState.value = PrinterState.Connected
                val deviceName = try { device.name ?: macAddress } catch (e: Exception) { macAddress }
                _statusMessage.value = "Connected to $deviceName"
                return@withContext true
            } else {
                _printerState.value = PrinterState.Failed
                _statusMessage.value = "Could not establish socket connection"
                return@withContext false
            }
        } catch (e: SecurityException) {
            closeActiveSocket()
            _printerState.value = PrinterState.Failed
            _statusMessage.value = "Bluetooth permission declined/denied"
            false
        } catch (e: Exception) {
            closeActiveSocket()
            _printerState.value = PrinterState.Failed
            _statusMessage.value = "Connection failed: ${e.message}"
            false
        }
    }

    suspend fun printReceiptText(receiptText: String): Boolean = withContext(Dispatchers.IO) {
        printMutex.withLock {
            val mac = prefs.getSelectedPrinterAddress()
            if (mac.isNullOrBlank()) {
                _statusMessage.value = "No printer selected"
                return@withContext false
            }

            // If socket is disconnected, connect
            if (socket == null || socket?.isConnected != true) {
                val reconnected = connectPrinter(mac)
                if (!reconnected) return@withContext false
            }

            try {
                _printerState.value = PrinterState.Printing
                _statusMessage.value = "Printing receipt..."

                val os = outputStream ?: throw Exception("Output stream is null")

                // 1. ESC/POS Reset & Init command: 0x1B 0x40
                os.write(byteArrayOf(0x1B, 0x40))

                // 2. Set Thermal Heating Parameters for maximum darkness / density:
                // Command ESC 7 (0x1B 0x37 [n1 max heating dots=7] [n2 heating time=255] [n3 heating interval=2])
                os.write(byteArrayOf(0x1B, 0x37, 0x07.toByte(), 0xFF.toByte(), 0x02.toByte()))

                // 3. Set Thermal Print Density (DC2 # n -> 0x12 0x23 0x1F - max density)
                os.write(byteArrayOf(0x12, 0x23, 0x1F))

                // 4. Turn on Emphasized / Bold (ESC E 1: 0x1B 0x45 0x01)
                os.write(byteArrayOf(0x1B, 0x45, 0x01))

                // 5. Turn on Double-strike Mode (ESC G 1: 0x1B 0x47 0x01) for extra deep/dark text
                os.write(byteArrayOf(0x1B, 0x47, 0x01))

                // Write receipt text bytes
                os.write(receiptText.toByteArray(Charsets.UTF_8))

                // ESC/POS Cut paper / feed command: GS V B 0
                os.write(byteArrayOf(0x1D, 0x56, 0x42, 0x00))
                os.flush()

                _printerState.value = PrinterState.Connected
                _statusMessage.value = "Printing Completed Successfully"
                true
            } catch (e: Exception) {
                // If write fails, close socket so next attempt performs a fresh clean reconnection
                closeActiveSocket()
                _printerState.value = PrinterState.Failed
                _statusMessage.value = "Print failed: ${e.message}"
                false
            }
        }
    }

    fun disconnect() {
        closeActiveSocket()
        _printerState.value = PrinterState.Disconnected
        _statusMessage.value = "Disconnected"
    }
}
