package com.maduraifoodcorner.admin.utils

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import androidx.core.content.FileProvider
import com.maduraifoodcorner.admin.R
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
     * Generates a modern minimalist PDF invoice matching the exact design specification:
     * - Bold "INVOICE" header with "Madurai Food Corner" and "Special Order"
     * - Invoice Number, Invoice Date, Due Date, and Customer details
     * - Illustrated food platter artwork in the top right
     * - Clean horizontal bordered table with Item, Qty, Price, Amount
     * - Currency displayed in "Rs." (e.g. Rs. 80.00, Rs. 8000.00)
     * - Subtotal, Advance Paid, Balance Due / Total Due
     * - Order Notes section
     * - Centered "Thank you for your order!" footer
     */
    fun generateInvoicePdf(order: SpecialOrder): File {
        val pdfDocument = PdfDocument()
        val pageInfo = PdfDocument.PageInfo.Builder(595, 842, 1).create() // Standard A4 (595 x 842 pt)
        val page = pdfDocument.startPage(pageInfo)
        val canvas = page.canvas

        val blackColor = Color.rgb(20, 20, 20)
        val darkGray = Color.rgb(70, 70, 70)

        // ─── Paint Styles ───
        val invoiceTitlePaint = Paint().apply {
            color = Color.BLACK
            textSize = 30f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            isAntiAlias = true
        }

        val brandTitlePaint = Paint().apply {
            color = blackColor
            textSize = 14f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            isAntiAlias = true
        }

        val subtitlePaint = Paint().apply {
            color = darkGray
            textSize = 12f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
            isAntiAlias = true
        }

        val metaLabelPaint = Paint().apply {
            color = blackColor
            textSize = 11f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            isAntiAlias = true
        }

        val metaValuePaint = Paint().apply {
            color = darkGray
            textSize = 11f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
            isAntiAlias = true
        }

        val tableHeaderPaint = Paint().apply {
            color = Color.BLACK
            textSize = 11.5f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            isAntiAlias = true
        }

        val tableTextPaint = Paint().apply {
            color = blackColor
            textSize = 10.5f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
            isAntiAlias = true
        }

        val tableLinePaint = Paint().apply {
            color = Color.BLACK
            strokeWidth = 1.5f
            isAntiAlias = true
        }

        val thankYouPaint = Paint().apply {
            color = Color.BLACK
            textSize = 14f
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            textAlign = Paint.Align.CENTER
            isAntiAlias = true
        }

        // ─── Top Left: Header & Details ───
        var yPos = 82f
        val leftX = 45f
        val rightLimit = 550f

        canvas.drawText("INVOICE", leftX, yPos, invoiceTitlePaint)
        yPos += 22f
        canvas.drawText("Madurai Food Corner", leftX, yPos, brandTitlePaint)
        yPos += 18f
        canvas.drawText("Special Order", leftX, yPos, subtitlePaint)

        yPos += 30f
        // Metadata fields
        val metaValues = listOf(
            "Invoice Number:" to order.orderNumber,
            "Invoice Date:" to order.createdAtFormatted.ifBlank { "Today" },
            "Due Date:" to order.eventDate.ifBlank { "On Delivery" },
            "Customer:" to "${order.customerName} (${order.customerPhone})"
        )

        metaValues.forEach { (label, value) ->
            canvas.drawText(label, leftX, yPos, metaLabelPaint)
            canvas.drawText(value, leftX + 105f, yPos, metaValuePaint)
            yPos += 18f
        }

        // ─── Top Right: Illustrated Artwork ───
        try {
            val artBitmap = BitmapFactory.decodeResource(context.resources, R.drawable.invoice_art)
            if (artBitmap != null) {
                val targetWidth = 195
                val targetHeight = (targetWidth.toFloat() / artBitmap.width * artBitmap.height).toInt()
                val scaled = Bitmap.createScaledBitmap(artBitmap, targetWidth, targetHeight, true)
                canvas.drawBitmap(scaled, rightLimit - targetWidth, 50f, null)
            }
        } catch (ignored: Exception) {}

        // ─── Table Section ───
        yPos = 245f

        // Top Border Line
        canvas.drawLine(leftX, yPos, rightLimit, yPos, tableLinePaint)
        yPos += 20f

        // Table Header Row
        val colItemX = leftX
        val colQtyX = 270f
        val colPriceX = 360f
        val colAmountX = 455f

        canvas.drawText("Item", colItemX, yPos, tableHeaderPaint)
        canvas.drawText("Qty", colQtyX, yPos, tableHeaderPaint)
        canvas.drawText("Price", colPriceX, yPos, tableHeaderPaint)
        canvas.drawText("Amount", colAmountX, yPos, tableHeaderPaint)

        yPos += 10f
        // Space below header
        yPos += 18f

        // Table Rows
        order.items.forEach { item ->
            val nameDisplay = if (item.foodName.length > 34) item.foodName.take(31) + "..." else item.foodName
            canvas.drawText(nameDisplay, colItemX, yPos, tableTextPaint)
            canvas.drawText("${item.quantity}", colQtyX, yPos, tableTextPaint)
            canvas.drawText("Rs. ${"%.2f".format(item.unitPrice)}", colPriceX, yPos, tableTextPaint)
            canvas.drawText("Rs. ${"%.2f".format(item.lineTotal)}", colAmountX, yPos, tableTextPaint)

            yPos += 24f
        }

        // Bottom Table Border Line
        yPos += 4f
        canvas.drawLine(leftX, yPos, rightLimit, yPos, tableLinePaint)
        yPos += 28f

        // ─── Bottom Breakdown & Order Notes ───
        val notesLeftX = 300f
        val summaryYStart = yPos

        // Left Column: Financial Breakdown in Rs.
        var sumY = summaryYStart
        val sumLabelX = leftX
        val sumValX = leftX + 110f

        canvas.drawText("Subtotal:", sumLabelX, sumY, metaLabelPaint)
        canvas.drawText("Rs. ${"%.2f".format(order.subtotal)}", sumValX, sumY, metaValuePaint)
        sumY += 18f

        if (order.advancePaid > 0) {
            canvas.drawText("Total Amount:", sumLabelX, sumY, metaLabelPaint)
            canvas.drawText("Rs. ${"%.2f".format(order.totalAmount)}", sumValX, sumY, metaValuePaint)
            sumY += 18f

            canvas.drawText("Advance Paid:", sumLabelX, sumY, metaLabelPaint)
            canvas.drawText("Rs. ${"%.2f".format(order.advancePaid)}", sumValX, sumY, metaValuePaint)
            sumY += 20f

            val totalDuePaint = Paint().apply {
                color = Color.BLACK
                textSize = 12f
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                isAntiAlias = true
            }
            canvas.drawText("BALANCE DUE:", sumLabelX, sumY, totalDuePaint)
            canvas.drawText("Rs. ${"%.2f".format(order.balanceAmount)}", sumValX, sumY, totalDuePaint)
        } else {
            val totalDuePaint = Paint().apply {
                color = Color.BLACK
                textSize = 12f
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                isAntiAlias = true
            }
            canvas.drawText("TOTAL DUE:", sumLabelX, sumY, totalDuePaint)
            canvas.drawText("Rs. ${"%.2f".format(order.totalAmount)}", sumValX, sumY, totalDuePaint)
        }

        // Right Column: Order Notes
        var notesY = summaryYStart
        canvas.drawText("Order Notes", notesLeftX, notesY, metaLabelPaint)
        notesY += 16f
        canvas.drawText("Please confirm the order details and", notesLeftX, notesY, metaValuePaint)
        notesY += 15f
        canvas.drawText("delivery information before payment.", notesLeftX, notesY, metaValuePaint)

        // ─── Center Footer: "Thank you for your order!" ───
        val pageCenterX = 297f
        var footerY = 730f

        canvas.drawText("Thank you", pageCenterX, footerY, thankYouPaint)
        footerY += 20f
        canvas.drawText("for your order!", pageCenterX, footerY, thankYouPaint)

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
            putExtra(Intent.EXTRA_SUBJECT, "Madurai Food Corner Invoice - $customerName")
            putExtra(Intent.EXTRA_TEXT, "Here is your Madurai Food Corner Special Bulk Order Invoice for $customerName.")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        context.startActivity(Intent.createChooser(intent, "Share Invoice PDF"))
    }
}
