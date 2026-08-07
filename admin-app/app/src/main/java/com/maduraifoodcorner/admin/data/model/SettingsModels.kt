package com.maduraifoodcorner.admin.data.model

data class RestaurantSettings(
    val id: String = "",
    val restaurant_name: String = "Madurai Food Corner",
    val logo_url: String? = null,
    val banner_url: String? = null,
    val phone_number: String = "+91 98765 43210",
    val email: String? = "orders@maduraifoodcorner.com",
    val address: String? = "123 South Veli Street, Madurai",
    val opening_time: String? = "07:30",
    val closing_time: String? = "23:00",
    val delivery_charge: Double = 30.0,
    val free_delivery_minimum_amount: Double = 500.0,
    val enable_online_ordering: Boolean = true,
    val enable_delivery: Boolean = true,
    val enable_takeaway: Boolean = true,
    val enable_dinein: Boolean = true,
    val disabled_dates: String? = "[]",
    val date_wise_ordering_enabled: Boolean = true,
    val order_discount_enabled: Boolean = false,
    val tier1_min_amount: Double? = 300.0,
    val tier1_percentage: Double? = 5.0,
    val tier2_min_amount: Double? = 500.0,
    val tier2_percentage: Double? = 10.0,
    val ordering_schedule_enabled: Boolean = true,
    val ordering_start_time: String? = "14:00",
    val ordering_end_time: String? = "10:00",
    val ordering_time_scope: String? = "EVERYDAY",
    val ordering_target_date: String? = null,
    val website_order_window_start: String? = "14:00",
    val website_order_window_end: String? = "11:15"
)

data class CalendarDateItem(
    val order_date: String = "",
    val is_open: Boolean = true
)

data class CalendarUpdateRequest(
    val dates: List<CalendarDateItem> = emptyList()
)
