package com.maduraifoodcorner.admin.data.model

data class Offer(
    val id: String = "",
    val title: String = "",
    val description: String? = null,
    val image_url: String? = null,
    val price: Double? = null,
    val offer_enabled: Boolean = true,
    val offer_price: Double? = null,
    val start_date: String? = null,
    val end_date: String? = null,
    val available: Boolean = true
)

data class OfferCreateRequest(
    val title: String,
    val description: String? = null,
    val image_url: String? = null,
    val price: Double? = null,
    val offer_enabled: Boolean = true,
    val offer_price: Double? = null,
    val start_date: String? = null,
    val end_date: String? = null,
    val available: Boolean = true
)
