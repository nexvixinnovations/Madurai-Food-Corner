package com.maduraifoodcorner.admin.data.printer

import android.content.Context

class PrinterPreferences(context: Context) {
    private val prefs = context.getSharedPreferences("mfc_printer_prefs", Context.MODE_PRIVATE)

    fun getSelectedPrinterAddress(): String? {
        return prefs.getString("selected_printer_mac", null)
    }

    fun setSelectedPrinterAddress(mac: String?) {
        prefs.edit().putString("selected_printer_mac", mac).apply()
    }

    fun isAutoConnectEnabled(): Boolean {
        return prefs.getBoolean("auto_connect", true)
    }

    fun setAutoConnectEnabled(enabled: Boolean) {
        prefs.edit().putBoolean("auto_connect", enabled).apply()
    }
}
