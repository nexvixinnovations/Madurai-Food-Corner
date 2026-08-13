package com.maduraifoodcorner.admin.data.model

data class FoodItem(
    val id: String = "",
    val name: String = "",
    val category: String = "",
    val food_type: String = "Veg",
    val image_url: String? = null,
    val price: Double = 0.0,
    val offer_enabled: Boolean = false,
    val offer_price: Double? = null,
    val offer_percentage: Double? = null,
    val available: Boolean = true,
    val online_available: Boolean = true,
    val display_order: Int = 0,
    val preparation_time: Int = 20,
    val description: String? = null,
    val available_days: String? = "Every Day"
)

data class FoodCreateRequest(
    val name: String,
    val category: String,
    val food_type: String,
    val price: Double,
    val offer_enabled: Boolean = false,
    val offer_price: Double? = null,
    val offer_percentage: Double? = null,
    val available: Boolean = true,
    val online_available: Boolean = true,
    val display_order: Int = 0,
    val preparation_time: Int = 20,
    val description: String? = null,
    val image_url: String? = null,
    val available_days: String? = "Every Day"
)
