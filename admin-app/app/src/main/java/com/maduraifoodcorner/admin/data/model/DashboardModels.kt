package com.maduraifoodcorner.admin.data.model

data class DashboardOverview(
    val total_sales: Double = 0.0,
    val total_orders: Int = 0,
    val pending_orders: Int = 0,
    val preparing_orders: Int = 0,
    val ready_orders: Int = 0,
    val completed_orders: Int = 0,
    val top_selling_foods: List<FoodItem> = emptyList(),
    val top_selling_combos: List<Combo> = emptyList(),
    val recent_orders: List<Order> = emptyList()
)
