package com.maduraifoodcorner.admin.data.printer

import com.maduraifoodcorner.admin.data.model.Order

object ReceiptFormatter {

    /**
     * Formats an Order into exact 32-column 58mm ESC/POS thermal receipt string format
     */
    fun formatReceipt(order: Order): String {
        val sb = StringBuilder()

        // Centered Restaurant Name Header
        sb.append("      MADURAI FOOD CORNER\n")
        sb.append("--------------------------------\n")

        // Order Metadata
        sb.append("Order No : ${order.order_number}\n")
        
        val dateStr = order.created_at?.take(10) ?: order.required_date
        sb.append("Date     : $dateStr\n")

        val timeStr = order.required_time ?: "12:30 PM"
        sb.append("Time     : $timeStr\n")

        sb.append("Order    : ${order.order_type}\n")
        sb.append("Source   : ${order.order_source}\n")
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

        // Grand Total (NO GST added)
        val totalAmt = String.format("Rs.%.0f", order.total_amount)
        val totalLine = "TOTAL".padEnd(18) + totalAmt.padStart(14)
        sb.append("$totalLine\n")
        sb.append("--------------------------------\n")

        // Footer
        sb.append("           Thank You!\n")
        sb.append("          Visit Again\n\n\n")

        return sb.toString()
    }
}
