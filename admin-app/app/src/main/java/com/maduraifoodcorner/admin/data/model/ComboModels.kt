package com.maduraifoodcorner.admin.data.model

data class ComboItemRelation(
    val id: String = "",
    val combo_id: String = "",
    val food_item_id: String = "",
    val quantity: Int = 1,
    val food_items: FoodItem? = null
)

data class Combo(
    val id: String = "",
    val name: String = "",
    val image_url: String? = null,
    val price: Double = 0.0,
    val dine_in_price: Double? = null,
    val parcel_price: Double? = null,
    val offer_enabled: Boolean = false,
    val offer_price: Double? = null,
    val available: Boolean = true,
    val combo_items: List<ComboItemRelation> = emptyList()
)

data class ComboItemInput(
    val food_item_id: String,
    val quantity: Int
)

data class ComboCreateRequest(
    val name: String,
    val price: Double,
    val dine_in_price: Double? = null,
    val parcel_price: Double? = null,
    val offer_enabled: Boolean = false,
    val offer_price: Double? = null,
    val available: Boolean = true,
    val image_url: String? = null,
    val combo_items: List<ComboItemInput> = emptyList()
)
