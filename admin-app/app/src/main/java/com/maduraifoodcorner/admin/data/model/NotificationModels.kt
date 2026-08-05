package com.maduraifoodcorner.admin.data.model

data class AppNotification(
    val id: String = "",
    val channel: String = "In-App",
    val recipient: String = "",
    val title: String = "",
    val body: String = "",
    val status: String = "Sent",
    val created_at: String? = null
)
