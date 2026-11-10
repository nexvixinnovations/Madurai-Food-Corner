package com.maduraifoodcorner.admin.utils

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import androidx.core.content.FileProvider
import com.maduraifoodcorner.admin.data.model.SpecialOrder
import dagger.hilt.android.qualifiers.ApplicationContext
import java.io.File
import java.io.FileOutputStream
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SpecialOrderPdfGenerator @Inject constructor(
    @ApplicationContext private val context: Context
) {

    /**
     * Generates a professional PDF invoice for the special order and saves it to local app storage.
     */
    fun generateInvoicePdf(order: SpecialOrder): File {
        val pdfDocument = PdfDocument()
        val pageInfo = PdfDocument.PageInfo.Builder(595, 842, 1).create() // Standard A4 (595 x 842)
        val page = pdfDocument.startPage(pageInfo)
        val canvas = page.canvas

        val titlePaint = Paint().apply {
            color = Color.rgb(183, 28, 28) // Deep Crimson Red
            textSize = 20f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            isAntiAlias = true
        }

        val subtitlePaint = Paint().apply {
            color = Color.rgb(80, 80, 80)
            textSize = 10f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
            isAntiAlias = true
        }

        val sectionHeadingPaint = Paint().apply {
            color = Color.rgb(33, 33, 33)
            textSize = 12f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            isAntiAlias = true
        }

        val textPaint = Paint().apply {
            color = Color.rgb(40, 40, 40)
            textSize = 10f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
            isAntiAlias = true
        }

        val boldTextPaint = Paint().apply {
            color = Color.rgb(30, 30, 30)
            textSize = 10f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            isAntiAlias = true
        }

        val tableHeaderPaint = Paint().apply {
            color = Color.rgb(240, 240, 240)
            style = Paint.Style.FILL
        }

        val linePaint = Paint().apply {
            color = Color.rgb(210, 210, 210)
            strokeWidth = 1f
        }

        var yPos = 45f

        // ─── Header: Restaurant Branding ───
        canvas.drawText("MADURAI FOOD CORNER", 40f, yPos, titlePaint)
        yPos += 14f
        canvas.drawText("Authentic Madurai Special Catering & Restaurant ERP", 40f, yPos, subtitlePaint)
        yPos += 12f
        canvas.drawText("Main Road, Madurai | Phone: +91 98765 43210 | GSTIN: 33AAAAA0000A1Z5", 40f, yPos, subtitlePaint)
        yPos += 16f

        // Invoice Banner
        canvas.drawLine(40f, yPos, 555f, yPos, linePaint)
        yPos += 20f

        val invoiceBannerPaint = Paint().apply {
            color = Color.rgb(230, 81, 0)
            textSize = 14f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            isAntiAlias = true
        }
        canvas.drawText("SPECIAL BULK ORDER INVOICE", 40f, yPos, invoiceBannerPaint)
        yPos += 22f

        // ─── Order & Customer Info (Two Columns) ───
        val leftX = 40f
        val rightX = 320f
        val metaStartY = yPos

        // Left Column: Customer Details
        canvas.drawText("CUSTOMER DETAILS:", leftX, metaStartY, sectionHeadingPaint)
        canvas.drawText("Name: ${order.customerName}", leftX, metaStartY + 15f, textPaint)
        canvas.drawText("Phone: ${order.customerPhone}", leftX, metaStartY + 30f, textPaint)
        if (order.eventDate.isNotBlank()) {
            canvas.drawText("Event/Delivery: ${order.eventDate}", leftX, metaStartY + 45f, textPaint)
        }

        // Right Column: Order Details
        canvas.drawText("INVOICE DETAILS:", rightX, metaStartY, sectionHeadingPaint)
        canvas.drawText("Order No: ${order.orderNumber}", rightX, metaStartY + 15f, boldTextPaint)
        canvas.drawText("Date: ${order.createdAtFormatted.ifBlank { "Today" }}", rightX, metaStartY + 30f, textPaint)
        val statusColor = if (order.balanceAmount <= 0) Color.rgb(46, 125, 50) else Color.rgb(198, 40, 40)
        val statusPaint = Paint().apply {
            color = statusColor
            textSize = 10f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        }
        canvas.drawText("Payment Status: ${order.paymentStatus}", rightX, metaStartY + 45f, statusPaint)

        yPos = metaStartY + 70f

        // ─── Items Table Header ───
        canvas.drawRect(40f, yPos - 12f, 555f, yPos + 8f, tableHeaderPaint)
        canvas.drawText("S.No", 48f, yPos, sectionHeadingPaint)
        canvas.drawText("Item Name", 90f, yPos, sectionHeadingPaint)
        canvas.drawText("Qty (Bulk)", 320f, yPos, sectionHeadingPaint)
        canvas.drawText("Price (₹)", 410f, yPos, sectionHeadingPaint)
        canvas.drawText("Total (₹)", 490f, yPos, sectionHeadingPaint)

        yPos += 14f
        canvas.drawLine(40f, yPos, 555f, yPos, linePaint)
        yPos += 14f

        // ─── Table Rows ───
        order.items.forEachIndexed { index, item ->
            canvas.drawText("${index + 1}", 48f, yPos, textPaint)
            val nameDisplay = if (item.foodName.length > 34) item.foodName.take(31) + "..." else item.foodName
            canvas.drawText(nameDisplay, 90f, yPos, boldTextPaint)
            canvas.drawText("${item.quantity}", 320f, yPos, textPaint)
            canvas.drawText("₹${"%.2f".format(item.unitPrice)}", 410f, yPos, textPaint)
            canvas.drawText("₹${"%.2f".format(item.lineTotal)}", 490f, yPos, boldTextPaint)

            yPos += 18f
            if (index < order.items.size - 1) {
                val dottedLine = Paint().apply {
                    color = Color.rgb(240, 240, 240)
                    strokeWidth = 1f
                }
                canvas.drawLine(40f, yPos - 6f, 555f, yPos - 6f, dottedLine)
            }
        }

        yPos += 10f
        canvas.drawLine(40f, yPos, 555f, yPos, linePaint)
        yPos += 20f

        // ─── Totals & Financial Balance Box ───
        val boxLeft = 310f
        val boxRight = 555f
        val boxTop = yPos - 10f
        val boxHeight = 105f

        val boxBg = Paint().apply {
            color = Color.rgb(250, 250, 250)
            style = Paint.Style.FILL
        }
        val boxBorder = Paint().apply {
            color = Color.rgb(200, 200, 200)
            style = Paint.Style.STROKE
            strokeWidth = 1.5f
        }
        canvas.drawRect(boxLeft, boxTop, boxRight, boxTop + boxHeight, boxBg)
        canvas.drawRect(boxLeft, boxTop, boxRight, boxTop + boxHeight, boxBorder)

        var totalY = boxTop + 22f
        canvas.drawText("Subtotal:", boxLeft + 15f, totalY, textPaint)
        canvas.drawText("₹${"%.2f".format(order.subtotal)}", boxRight - 80f, totalY, textPaint)

        totalY += 20f
        val totalLabelPaint = Paint().apply {
            color = Color.BLACK
            textSize = 12f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        }
        canvas.drawText("TOTAL AMOUNT:", boxLeft + 15f, totalY, totalLabelPaint)
        canvas.drawText("₹${"%.2f".format(order.totalAmount)}", boxRight - 80f, totalY, totalLabelPaint)

        totalY += 20f
        val advancePaint = Paint().apply {
            color = Color.rgb(46, 125, 50)
            textSize = 11f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        }
        canvas.drawText("Advance Paid:", boxLeft + 15f, totalY, advancePaint)
        canvas.drawText("₹${"%.2f".format(order.advancePaid)}", boxRight - 80f, totalY, advancePaint)

        totalY += 22f
        val balanceColor = if (order.balanceAmount <= 0) Color.rgb(46, 125, 50) else Color.rgb(198, 40, 40)
        val balancePaint = Paint().apply {
            color = balanceColor
            textSize = 13f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        }
        canvas.drawText("BALANCE DUE:", boxLeft + 15f, totalY, balancePaint)
        canvas.drawText("₹${"%.2f".format(order.balanceAmount)}", boxRight - 80f, totalY, balancePaint)

        // ─── Footer Notes & Terms ───
        yPos = boxTop + boxHeight + 40f
        val footerPaint = Paint().apply {
            color = Color.rgb(100, 100, 100)
            textSize = 9f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.ITALIC)
        }
        canvas.drawText("Terms & Conditions:", 40f, yPos, sectionHeadingPaint)
        yPos += 14f
        canvas.drawText("1. Advance payment is non-refundable once kitchen preparation begins.", 40f, yPos, footerPaint)
        yPos += 12f
        canvas.drawText("2. Remaining balance must be cleared upon delivery or event service completion.", 40f, yPos, footerPaint)
        yPos += 12f
        canvas.drawText("3. This is a computer-generated special order invoice and requires no physical signature.", 40f, yPos, footerPaint)

        yPos += 25f
        val centerThankYou = Paint().apply {
            color = Color.rgb(183, 28, 28)
            textSize = 11f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            textAlign = Paint.Align.CENTER
        }
        canvas.drawText("Thank you for your special order! Taste the Pride of Madurai.", 297f, yPos, centerThankYou)

        pdfDocument.finishPage(page)

        // Save PDF file to storage
        val directory = context.getExternalFilesDir("special_order_invoices") ?: context.filesDir
        if (!directory.exists()) {
            directory.mkdirs()
        }
        val fileName = "Invoice_${order.orderNumber}.pdf"
        val file = File(directory, fileName)
        val outputStream = FileOutputStream(file)
        pdfDocument.writeTo(outputStream)
        outputStream.flush()
        outputStream.close()
        pdfDocument.close()

        return file
    }

    /**
     * Opens PDF with installed viewer application.
     */
    fun openPdf(context: Context, file: File) {
        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            file
        )
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/pdf")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(Intent.createChooser(intent, "Open Invoice PDF"))
    }

    /**
     * Shares PDF via WhatsApp, Email, etc.
     */
    fun sharePdf(context: Context, file: File, customerName: String) {
        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            file
        )
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "application/pdf"
            putExtra(Intent.EXTRA_STREAM, uri)
            putExtra(Intent.EXTRA_SUBJECT, "Madurai Food Corner Special Order Invoice - $customerName")
            putExtra(Intent.EXTRA_TEXT, "Here is your Madurai Food Corner Special Bulk Order Invoice for $customerName.")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        context.startActivity(Intent.createChooser(intent, "Share Invoice PDF"))
    }
}

