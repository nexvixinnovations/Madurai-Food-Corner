package com.maduraifoodcorner.admin.ui.screens.printer

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.maduraifoodcorner.admin.data.printer.BluetoothPrinterDevice
import com.maduraifoodcorner.admin.data.printer.BluetoothPrinterManager
import com.maduraifoodcorner.admin.data.printer.PrinterState
import com.maduraifoodcorner.admin.data.repository.PrintRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class PrinterViewModel @Inject constructor(
    private val printerManager: BluetoothPrinterManager,
    private val printRepository: PrintRepository
) : ViewModel() {

    private val _pairedDevices = MutableStateFlow<List<BluetoothPrinterDevice>>(emptyList())
    val pairedDevices: StateFlow<List<BluetoothPrinterDevice>> = _pairedDevices

    private val _printerState = MutableStateFlow(PrinterState.Disconnected)
    val printerState: StateFlow<PrinterState> = _printerState

    private val _statusMessage = MutableStateFlow("Select a Bluetooth printer")
    val statusMessage: StateFlow<String> = _statusMessage

    init {
        viewModelScope.launch {
            printerManager.printerState.collect { _printerState.value = it }
        }
        viewModelScope.launch {
            printerManager.statusMessage.collect { _statusMessage.value = it }
        }
        refreshDevices()
    }

    fun refreshDevices() {
        _pairedDevices.value = printerManager.getPairedPrinters()
    }

    fun connectPrinter(device: BluetoothPrinterDevice) {
        viewModelScope.launch {
            printerManager.connectPrinter(device.address)
        }
    }

    fun printTestReceipt() {
        viewModelScope.launch {
            printRepository.printTestReceipt()
        }
    }
}
