package com.maduraifoodcorner.admin.data.models

data class UserDto(
    val id: String,
    val name: String,
    val email: String,
    val role: String
)

data class FoodItemDto(
    val id: String,
    val name: String,
    val description: String?,
    val category: String,
    val price: Double,
    val isAvailable: Boolean
)

data class OrderDto(
    val id: String,
    val orderNumber: String,
    val totalAmount: Double,
    val status: String,
    val paymentStatus: String
)

data class ApiResponse<T>(
    val success: Boolean,
    val statusCode: Int,
    val message: String,
    val data: T?
)
