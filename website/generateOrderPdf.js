import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const order = {
  id: '5b8bab5f-b0b0-4eaf-909b-bf051c2ccc93',
  order_number: 'MFCW-02-09-003',
  customer_id: 'd139e249-3aa2-44bb-ba39-165ab06f4f7c',
  order_source: 'website',
  required_date: '2026-09-02T00:00:00.000Z',
  required_time: null,
  order_type: 'Parcel',
  payment_method: 'UPI',
  payment_status: 'Paid',
  status: 'Accepted',
  subtotal: 80,
  eligible_subtotal: 80,
  special_offer_subtotal: 0,
  discount_percentage: 0,
  discount_amount: 0,
  total_amount: 80,
  created_at: '2026-09-02T05:34:21.618Z',
  customers: {
    name: 'Ratheesh',
    phone: '9965036418',
    email: 'nsratheesh1@gamil.com',
  },
  order_items: [
    {
      food_items: {
        name: 'Chicken Rice',
      },
      quantity: 1,
      unit_price: 80,
      line_total: 80,
    },
  ],
  payments: [
    {
      transaction_id: '6802793072',
      payment_gateway: 'Cashfree',
      amount: 80,
      status: 'Paid',
      paid_at: '2026-09-02T05:56:43.320Z',
    },
  ],
};

function generatePdf(orderData, outputPath) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // ~148 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // ~210 mm
  const margin = 10;
  const contentWidth = pageWidth - margin * 2; // ~128 mm
  let currentY = 12;

  const colorMaroon = [139, 26, 26]; // #8B1A1A
  const colorGold = [217, 119, 6]; // #D97706
  const colorDark = [31, 41, 55]; // #1F2937
  const colorMuted = [107, 114, 128]; // #6B7280
  const colorLine = [229, 231, 235]; // #E5E7EB
  const colorGreen = [16, 149, 106]; // #10956A

  // Top Brand Accent Bar
  doc.setFillColor(...colorMaroon);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Restaurant Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...colorMaroon);
  doc.text('MADURAI FOOD CORNER', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...colorMuted);
  doc.text('AUTHENTIC SOUTH INDIAN CUISINE & CATERING', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4;

  doc.setFontSize(7.5);
  doc.setTextColor(...colorDark);
  doc.text('Contact: +91 99522 50435 / +91 77083 82018', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  // Divider
  doc.setDrawColor(...colorLine);
  doc.setLineWidth(0.3);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 4;

  // Title Badge
  doc.setFillColor(248, 244, 239);
  doc.roundedRect(margin, currentY, contentWidth, 6.5, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...colorMaroon);
  doc.text('TAX INVOICE / ORDER BILL', pageWidth / 2, currentY + 4.5, { align: 'center' });
  currentY += 9;

  // Meta info
  const orderNum = orderData.order_number || 'N/A';
  const orderDateObj = orderData.created_at ? new Date(orderData.created_at) : new Date();
  const dateStr = orderDateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = orderDateObj.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const customerName = orderData.customers?.name || 'Valued Customer';
  const customerPhone = orderData.customers?.phone || 'N/A';
  const orderType = orderData.order_type || 'Parcel';
  const paymentMethod = orderData.payment_method || 'UPI';

  // Left Column
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colorDark);
  doc.text('Order No: ', margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colorMaroon);
  doc.text(`${orderNum}`, margin + 16, currentY);

  // Right Column
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colorDark);
  doc.text('Date: ', pageWidth / 2 + 5, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${dateStr} ${timeStr}`, pageWidth / 2 + 15, currentY);
  currentY += 4.5;

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.text('Customer: ', margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${customerName}`, margin + 16, currentY);

  doc.setFont('helvetica', 'bold');
  doc.text('Phone: ', pageWidth / 2 + 5, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${customerPhone}`, pageWidth / 2 + 17, currentY);
  currentY += 4.5;

  // Row 3
  doc.setFont('helvetica', 'bold');
  doc.text('Order Type: ', margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${orderType}`, margin + 18, currentY);

  doc.setFont('helvetica', 'bold');
  doc.text('Payment: ', pageWidth / 2 + 5, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colorGreen);
  doc.text(`PAID (${paymentMethod})`, pageWidth / 2 + 20, currentY);
  currentY += 5;

  // Divider
  doc.setDrawColor(...colorLine);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 3;

  // Items table
  const tableHead = [['#', 'Item Description', 'Qty', 'Rate', 'Amount']];
  const tableBody = (orderData.order_items || []).map((item, idx) => {
    const name = item.food_items?.name || `Food Item ${idx + 1}`;
    const qty = String(item.quantity || 1);
    const rate = Number(item.unit_price || 0).toFixed(2);
    const total = Number(item.line_total || item.unit_price * item.quantity).toFixed(2);
    return [String(idx + 1), name, qty, `Rs. ${rate}`, `Rs. ${total}`];
  });

  autoTable(doc, {
    startY: currentY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: { top: 2.2, bottom: 2.2, left: 1.8, right: 1.8 },
      textColor: [40, 40, 40],
      lineColor: [230, 230, 230],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [248, 241, 235],
      textColor: [139, 26, 26],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      lineWidth: 0.2,
      lineColor: [215, 205, 195],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 12, halign: 'center' },
      3: { cellWidth: 24, halign: 'right' },
      4: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });

  let finalY = (doc.lastAutoTable?.finalY ?? currentY + 30) + 3;
  if (finalY > pageHeight - 48) {
    doc.addPage();
    finalY = 14;
  }

  // Summary box
  const summaryWidth = 62;
  const summaryX = pageWidth - margin - summaryWidth;
  let summaryY = finalY;

  const subtotal = Number(orderData.subtotal || orderData.total_amount || 0);
  const grandTotal = Number(orderData.total_amount || 0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...colorMuted);
  doc.text('Subtotal:', summaryX, summaryY + 3);
  doc.setTextColor(...colorDark);
  doc.text(`Rs. ${subtotal.toFixed(2)}`, pageWidth - margin, summaryY + 3, { align: 'right' });
  summaryY += 4.5;

  // Grand Total Box
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(...colorGold);
  doc.setLineWidth(0.3);
  doc.roundedRect(summaryX - 2, summaryY, summaryWidth + 2, 7, 1.2, 1.2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...colorMaroon);
  doc.text('GRAND TOTAL:', summaryX + 2, summaryY + 4.8);
  doc.text(`Rs. ${grandTotal.toFixed(2)}`, pageWidth - margin - 2, summaryY + 4.8, { align: 'right' });
  summaryY += 10;

  // Footer
  if (summaryY > pageHeight - 25) {
    doc.addPage();
    summaryY = 14;
  }

  doc.setDrawColor(...colorLine);
  doc.setLineWidth(0.2);
  doc.line(margin, summaryY, pageWidth - margin, summaryY);
  summaryY += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...colorMaroon);
  doc.text('Thank you for dining with Madurai Food Corner!', pageWidth / 2, summaryY, { align: 'center' });
  summaryY += 3.8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...colorMuted);
  doc.text('This is a computer generated receipt. For party or bulk orders call 9952250435.', pageWidth / 2, summaryY, { align: 'center' });

  // Save to file buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(outputPath, pdfBuffer);
  console.log(`PDF invoice successfully generated and saved at: ${outputPath}`);
}

const targetDir = path.resolve('..', 'downloaded_invoices');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const outputFile = path.join(targetDir, 'MFCW-02-09-003-bill.pdf');
generatePdf(order, outputFile);
