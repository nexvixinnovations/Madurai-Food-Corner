package com.maduraifoodcorner.admin.data.model

data class Payment(
    val id: String = "",
    val order_id: String = "",
    val amount: Double = 0.0,
    val payment_gateway: String = "Manual",
    val payment_method: String = "Cash",
    val status: String = "Paid",
    val created_at: String? = null,
    val orders: Order? = null
)
