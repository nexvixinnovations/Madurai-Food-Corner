package com.maduraifoodcorner.admin.data.model

data class SalesReportData(
    val preset: String = "today",
    val start_date: String = "",
    val end_date: String = "",
    val summary: SalesSummary = SalesSummary()
)

data class SalesSummary(
    val total_revenue: Double = 0.0,
    val total_orders: Int = 0,
    val paid_orders: Int = 0,
    val average_order_value: Double = 0.0
)

data class BusinessOverviewReport(
    val todayOrders: Int = 0,
    val todayRevenue: Double = 0.0,
    val weeklyOrders: Int = 0,
    val weeklyRevenue: Double = 0.0,
    val monthlyOrders: Int = 0,
    val monthlyRevenue: Double = 0.0,
    val averageOrderValue: Double = 0.0,
    val topSellingFood: String = "N/A",
    val mostOrderedCategory: String = "General"
)
