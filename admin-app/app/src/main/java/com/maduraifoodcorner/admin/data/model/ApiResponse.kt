package com.maduraifoodcorner.admin.data.model

data class ApiResponse<T>(
    val success: Boolean,
    val message: String,
    val data: T?,
    val error: Any? = null
)
