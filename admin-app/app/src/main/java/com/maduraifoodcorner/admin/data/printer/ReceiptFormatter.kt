package com.maduraifoodcorner.admin.data.printer

import com.maduraifoodcorner.admin.data.model.Order

object ReceiptFormatter {

    /**
     * Formats an Order into exact 32-column 58mm ESC/POS thermal receipt string format
     */
    fun formatReceipt(order: Order): String {
        val sb = StringBuilder()

        // 1. ESC/POS Init & Max Bold / Double Strike
        val ESC = "\u001b"
        val INIT = "$ESC@"
        val ALIGN_CENTER = "${ESC}a\u0001"
        val ALIGN_LEFT = "${ESC}a\u0000"
        val BOLD_ON = "${ESC}E\u0001"
        val DOUBLE_STRIKE_ON = "${ESC}G\u0001"
        val FONT_LARGE_BOLD = "${ESC}!\u0018"
        val FONT_NORMAL = "${ESC}!\u0000"

        sb.append(INIT)
        sb.append(BOLD_ON)
        sb.append(DOUBLE_STRIKE_ON)

        // Centered Restaurant Name Header (Large & Dark)
        sb.append(ALIGN_CENTER)
        sb.append(FONT_LARGE_BOLD)
        sb.append("MADURAI FOOD CORNER\n")
        sb.append(FONT_NORMAL)
        sb.append(BOLD_ON)
        sb.append(DOUBLE_STRIKE_ON)
        sb.append("Authentic Madurai Taste\n")
        sb.append(ALIGN_LEFT)
        sb.append("--------------------------------\n")

        // Order Metadata
        sb.append("Order No : ${order.order_number}\n")
        
        val dateStr = order.created_at?.take(10) ?: order.required_date
        sb.append("Date     : $dateStr\n")

        val timeStr = order.required_time ?: "12:30 PM"
        sb.append("Time     : $timeStr\n")

        val displayOrderType = if (order.order_source.contains("POS", ignoreCase = true) || (order.order_type.equals("Parcel", ignoreCase = true) && order.order_source.contains("POS", ignoreCase = true))) "Shop" else order.order_type
        sb.append("Order    : $displayOrderType\n")
        sb.append("Source   : ${order.order_source}\n")
        if (order.customers != null && !order.customers.name.isNullOrBlank() && order.customers.name.lowercase() !in listOf("walk-in customer", "walk-in", "guest") && order.customers.phone != "0000000000") {
            sb.append("Customer : ${order.customers.name} (${order.customers.phone})\n")
        }
        sb.append("--------------------------------\n")

        // Column Headers
        sb.append("Item               Qty       Amt\n")
        sb.append("--------------------------------\n")

        // Line Items
        order.order_items.forEach { item ->
            val rawName = item.food_items?.name ?: item.combos?.name ?: "Food Item"
            val itemName = if (rawName.length > 15) rawName.take(15) else rawName.padEnd(15)
            val qtyStr = item.quantity.toString().padStart(3)
            val amtStr = String.format("Rs.%.0f", item.line_total).padStart(14)

            sb.append("$itemName$qtyStr$amtStr\n")
        }

        sb.append("--------------------------------\n")

        // Subtotal & Discount Calculation Display
        val subtotalVal = order.subtotal ?: order.order_items.sumOf { it.line_total }
        if (order.discount_amount != null && order.discount_amount > 0) {
            val subtotalStr = String.format("Rs.%.0f", subtotalVal)
            sb.append("Subtotal".padEnd(18) + subtotalStr.padStart(14) + "\n")

            val pct = order.discount_percentage?.toInt() ?: 0
            val discStr = String.format("-Rs.%.0f", order.discount_amount)
            sb.append("Offer ($pct%)".padEnd(18) + discStr.padStart(14) + "\n")
            sb.append("--------------------------------\n")
        }

        // Grand Total (Bold & High Contrast)
        val totalAmt = String.format("Rs.%.0f", order.total_amount)
        val totalLine = "TOTAL".padEnd(18) + totalAmt.padStart(14)
        sb.append(FONT_LARGE_BOLD)
        sb.append("$totalLine\n")
        sb.append(FONT_NORMAL)
        sb.append(BOLD_ON)
        sb.append(DOUBLE_STRIKE_ON)
        sb.append("--------------------------------\n")

        // Footer
        sb.append(ALIGN_CENTER)
        sb.append("Thank You! Visit Again\n\n\n")

        return sb.toString()
    }
}
