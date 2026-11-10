package com.maduraifoodcorner.admin.data.model

import java.util.UUID

data class SpecialOrderItem(
    val id: String = UUID.randomUUID().toString(),
    val foodId: String? = null,
    val foodName: String = "",
    val category: String = "Special Order",
    val quantity: Int = 1,
    val unitPrice: Double = 0.0, // Fully editable unit price for bulk orders
    val standardPrice: Double = 0.0
) {
    val lineTotal: Double
        get() = quantity * unitPrice
}

data class SpecialOrder(
    val id: String = UUID.randomUUID().toString(),
    val orderNumber: String = "", // Auto-generated sequential e.g. SPO-20261110-001
    val customerName: String = "",
    val customerPhone: String = "",
    val eventDate: String = "",
    val items: List<SpecialOrderItem> = emptyList(),
    val subtotal: Double = 0.0,
    val totalAmount: Double = 0.0,
    val advancePaid: Double = 0.0,
    val balanceAmount: Double = 0.0,
    val paymentStatus: String = "Pending", // "Fully Paid", "Partially Paid", "Pending"
    val createdAtMillis: Long = System.currentTimeMillis(),
    val createdAtFormatted: String = "",
    val pdfFilePath: String? = null
)

