package com.maduraifoodcorner.admin.ui.navigation

sealed class Screen(val route: String, val title: String, val shortTitle: String = title) {
    object Dashboard : Screen("dashboard", "Dashboard", "Dashboard")
    object Orders : Screen("orders", "Customer Orders", "Orders")
    object OrderDetails : Screen("orders/{orderId}", "Order Details", "Details") {
        fun createRoute(orderId: String) = "orders/$orderId"
    }
    object Foods : Screen("foods", "Food Catalog", "Foods")
    object Billing : Screen("billing", "Counter Billing", "Billing")
    object Reports : Screen("reports", "Business Reports", "Reports")
    object Settings : Screen("settings", "Restaurant Settings", "Settings")
    object PrinterSettings : Screen("printer_settings", "Printer Settings", "Printer")
    object About : Screen("about", "About Restaurant ERP", "About")
}
