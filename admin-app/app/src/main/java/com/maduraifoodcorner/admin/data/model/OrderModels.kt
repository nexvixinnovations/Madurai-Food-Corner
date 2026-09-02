package com.maduraifoodcorner.admin.data.model

data class Customer(
    val id: String = "",
    val name: String = "",
    val phone: String = "",
    val email: String? = null
)

data class OrderItem(
    val id: String = "",
    val order_id: String? = null,
    val food_item_id: String? = null,
    val combo_id: String? = null,
    val quantity: Int = 1,
    val unit_price: Double = 0.0,
    val line_total: Double = 0.0,
    val food_items: FoodItem? = null,
    val combos: Combo? = null
)

data class Order(
    val id: String = "",
    val order_number: String = "",
    val customer_id: String? = null,
    val order_source: String = "Website",
    val required_date: String = "",
    val required_time: String? = null,
    val order_type: String = "Parcel",
    val payment_method: String = "Cash",
    val payment_status: String = "Pending",
    val status: String = "Pending",
    val subtotal: Double? = null,
    val discount_percentage: Double? = null,
    val discount_amount: Double? = null,
    val total_amount: Double = 0.0,
    val special_instruction: String? = null,
    val created_at: String? = null,
    val customers: Customer? = null,
    val order_items: List<OrderItem> = emptyList()
)

data class OrderStatusUpdateRequest(
    val status: String
)

data class CreateOrderItemRequest(
    val type: String,
    val id: String,
    val quantity: Int,
    val unit_price: Double
)

data class CreateCustomerRequest(
    val name: String? = null,
    val phone: String? = null,
    val email: String? = null
)

data class CreatePosOrderRequest(
    val customer: CreateCustomerRequest? = null,
    val required_date: String,
    val required_time: String? = "12:00",
    val order_type: String = "Parcel",
    val payment_method: String = "Cash",
    val payment_status: String = "Completed",
    val status: String = "Completed",
    val order_source: String = "POS Counter",
    val items: List<CreateOrderItemRequest>
)
