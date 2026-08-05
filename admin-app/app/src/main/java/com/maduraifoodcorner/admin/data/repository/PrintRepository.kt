package com.maduraifoodcorner.admin.data.repository

import com.maduraifoodcorner.admin.data.model.Order
import com.maduraifoodcorner.admin.data.printer.BluetoothPrinterManager
import com.maduraifoodcorner.admin.data.printer.ReceiptFormatter

class PrintRepository(private val printerManager: BluetoothPrinterManager) {

    suspend fun printOrderReceipt(order: Order): Boolean {
        val receiptText = ReceiptFormatter.formatReceipt(order)
        return printerManager.printReceiptText(receiptText)
    }

    suspend fun printTestReceipt(): Boolean {
        val dummyText = "      MADURAI FOOD CORNER\n--------------------------------\nPrinter Connection Test\nStatus: OK\n--------------------------------\n\n\n"
        return printerManager.printReceiptText(dummyText)
    }
}
