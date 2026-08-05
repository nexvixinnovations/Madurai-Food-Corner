package com.maduraifoodcorner.admin.data.printer

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
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

    private val _printerState = MutableStateFlow(PrinterState.Disconnected)
    val printerState: StateFlow<PrinterState> = _printerState

    private val _statusMessage = MutableStateFlow("Disconnected")
    val statusMessage: StateFlow<String> = _statusMessage

    @SuppressLint("MissingPermission")
    fun getPairedPrinters(): List<BluetoothPrinterDevice> {
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled) {
            return emptyList()
        }
        return bluetoothAdapter.bondedDevices.map { device ->
            BluetoothPrinterDevice(
                name = device.name ?: "Unknown Device",
                address = device.address
            )
        }
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

            val device: BluetoothDevice = bluetoothAdapter.getRemoteDevice(macAddress)
            val uuid = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB") // SPP UUID

            socket?.close()
            socket = device.createRfcommSocketToServiceRecord(uuid)
            socket?.connect()
            outputStream = socket?.outputStream

            prefs.setSelectedPrinterAddress(macAddress)
            _printerState.value = PrinterState.Connected
            _statusMessage.value = "Connected to ${device.name}"
            true
        } catch (e: Exception) {
            _printerState.value = PrinterState.Failed
            _statusMessage.value = "Connection failed: ${e.message}"
            false
        }
    }

    suspend fun printReceiptText(receiptText: String): Boolean = withContext(Dispatchers.IO) {
        val mac = prefs.getSelectedPrinterAddress()
        if (socket == null || socket?.isConnected != true) {
            if (mac != null) {
                val reconnected = connectPrinter(mac)
                if (!reconnected) return@withContext false
            } else {
                _statusMessage.value = "No printer selected"
                return@withContext false
            }
        }

        try {
            _printerState.value = PrinterState.Printing
            _statusMessage.value = "Printing receipt..."

            val os = outputStream ?: throw Exception("Output stream is null")
            
            // ESC/POS Reset & Init command: 0x1B 0x40
            os.write(byteArrayOf(0x1B, 0x40))

            // Write receipt text bytes
            os.write(receiptText.toByteArray(Charsets.UTF_8))

            // ESC/POS Cut paper / feed command
            os.write(byteArrayOf(0x1D, 0x56, 0x42, 0x00))
            os.flush()

            _printerState.value = PrinterState.Connected
            _statusMessage.value = "Printing Completed Successfully"
            true
        } catch (e: Exception) {
            _printerState.value = PrinterState.Failed
            _statusMessage.value = "Print failed: ${e.message}"
            false
        }
    }

    fun disconnect() {
        try {
            outputStream?.close()
            socket?.close()
        } catch (ignored: Exception) {}
        _printerState.value = PrinterState.Disconnected
        _statusMessage.value = "Disconnected"
    }
}
