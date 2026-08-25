import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { Order } from '../types';

/**
 * Generate and download a formatted, professional PDF bill/receipt for a restaurant order.
 *
 * @param order   The order details object
 * @param isPaid  Optional override flag for verified payment
 */
export const generateReceiptPdf = (order: Order, isPaid?: boolean): void => {
  if (!order) {
    console.error('Cannot generate PDF: order object is empty');
    return;
  }

  // ── Document Setup (A5 Portrait: 148 x 210 mm) ─────────────────────────────
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

  // ── Color Palette ──────────────────────────────────────────────────────────
  const colorMaroon: [number, number, number] = [139, 26, 26]; // #8B1A1A
  const colorGold: [number, number, number] = [217, 119, 6]; // #D97706
  const colorDark: [number, number, number] = [31, 41, 55]; // #1F2937
  const colorMuted: [number, number, number] = [107, 114, 128]; // #6B7280
  const colorLine: [number, number, number] = [229, 231, 235]; // #E5E7EB
  const colorGreen: [number, number, number] = [16, 149, 106]; // #10956A

  // ── Draw Top Brand Accent Bar ──────────────────────────────────────────────
  doc.setFillColor(...colorMaroon);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // ── Restaurant Header ──────────────────────────────────────────────────────
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

  // Decorative Divider
  doc.setDrawColor(...colorLine);
  doc.setLineWidth(0.3);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 4;

  // ── Document Title Badge ───────────────────────────────────────────────────
  doc.setFillColor(248, 244, 239);
  doc.roundedRect(margin, currentY, contentWidth, 6.5, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...colorMaroon);
  doc.text('TAX INVOICE / ORDER BILL', pageWidth / 2, currentY + 4.5, { align: 'center' });
  currentY += 9;

  // ── Order Meta Info Grid ───────────────────────────────────────────────────
  const orderNum = order.order_number || order.id || 'N/A';
  const orderDateObj = order.created_at ? new Date(order.created_at) : new Date();
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

  const customerName = order.customers?.name || (order as any).customer_name || 'Valued Customer';
  const customerPhone = order.customers?.phone || (order as any).customer_phone || 'N/A';

  const orderType = order.order_type
    ? order.order_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Parcel';

  const paymentMethod = order.payment_method
    ? order.payment_method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Online';

  const dbPaymentStatus = order.payment_status?.toLowerCase();
  const resolvedIsPaid = isPaid || dbPaymentStatus === 'paid' || dbPaymentStatus === 'success';
  const paymentStatusStr = resolvedIsPaid ? 'PAID' : (order.payment_status || 'Pending').toUpperCase();

  // Left Column
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colorDark);
  doc.text(`Order No: `, margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colorMaroon);
  doc.text(`${orderNum}`, margin + 16, currentY);

  // Right Column
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colorDark);
  doc.text(`Date: `, pageWidth / 2 + 5, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${dateStr} ${timeStr}`, pageWidth / 2 + 15, currentY);
  currentY += 4.5;

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.text(`Customer: `, margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${customerName}`, margin + 16, currentY);

  doc.setFont('helvetica', 'bold');
  doc.text(`Phone: `, pageWidth / 2 + 5, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${customerPhone}`, pageWidth / 2 + 17, currentY);
  currentY += 4.5;

  // Row 3
  doc.setFont('helvetica', 'bold');
  doc.text(`Order Type: `, margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${orderType}`, margin + 18, currentY);

  doc.setFont('helvetica', 'bold');
  doc.text(`Payment: `, pageWidth / 2 + 5, currentY);
  doc.setFont('helvetica', 'bold');
  if (resolvedIsPaid) {
    doc.setTextColor(...colorGreen);
  } else {
    doc.setTextColor(...colorGold);
  }
  doc.text(`${paymentStatusStr} (${paymentMethod})`, pageWidth / 2 + 20, currentY);
  currentY += 5;

  // Divider before items table
  doc.setDrawColor(...colorLine);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 3;

  // ── Items Table Preparation ────────────────────────────────────────────────
  const tableHead = [['#', 'Item Description', 'Qty', 'Rate', 'Amount']];
  const itemsList = order.order_items || [];

  const tableBody: string[][] = itemsList.map((item, idx) => {
    let name: string =
      item.food_items?.name ||
      item.combos?.name ||
      item.special_offers?.title ||
      (item as any).name ||
      (item as any).food_item_name ||
      (item as any).title ||
      `Food Item ${idx + 1}`;

    // If combo, append breakdown of items
    if (item.combos?.combo_items && item.combos.combo_items.length > 0) {
      const comboSubItems = item.combos.combo_items
        .map((ci) => ci.food_items?.name || '')
        .filter(Boolean)
        .join(' + ');
      if (comboSubItems) {
        name = `${name}\n(${comboSubItems})`;
      }
    }

    const qty = String(item.quantity || 1);
    const unitPriceNum = Number(item.unit_price || 0);
    const lineTotalNum = Number(item.line_total ?? unitPriceNum * Number(item.quantity || 1));

    return [
      String(idx + 1),
      String(name),
      String(qty),
      `Rs. ${unitPriceNum.toFixed(2)}`,
      `Rs. ${lineTotalNum.toFixed(2)}`,
    ];
  });

  // Render Table via jspdf-autotable
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

  // Get position right after autoTable
  let finalY = ((doc as any).lastAutoTable?.finalY ?? currentY + 30) + 3;

  // If table went near bottom of page, add page to keep summary clean
  if (finalY > pageHeight - 48) {
    doc.addPage();
    finalY = 14;
  }

  // ── Calculation Totals Box ─────────────────────────────────────────────────
  const subtotal = Number(order.subtotal ?? order.total_amount ?? 0);
  const discountAmount = Number(order.discount_amount ?? 0);
  const grandTotal = Number(order.total_amount ?? 0);

  const summaryWidth = 62;
  const summaryX = pageWidth - margin - summaryWidth;
  let summaryY = finalY;

  // Subtotal row
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...colorMuted);
  doc.text('Subtotal:', summaryX, summaryY + 3);
  doc.setTextColor(...colorDark);
  doc.text(`Rs. ${subtotal.toFixed(2)}`, pageWidth - margin, summaryY + 3, { align: 'right' });
  summaryY += 4.5;

  // Discount row (if any)
  if (discountAmount > 0) {
    doc.setTextColor(...colorMaroon);
    const discountPercent = Number(order.discount_percentage || 0);
    const discountLabel = discountPercent > 0 ? `Discount (${discountPercent}%):` : 'Discount:';
    doc.text(discountLabel, summaryX, summaryY + 3);
    doc.text(`- Rs. ${discountAmount.toFixed(2)}`, pageWidth - margin, summaryY + 3, { align: 'right' });
    summaryY += 4.5;
  }

  // Grand Total Box
  doc.setFillColor(254, 243, 199); // Amber-100 tint
  doc.setDrawColor(...colorGold);
  doc.setLineWidth(0.3);
  doc.roundedRect(summaryX - 2, summaryY, summaryWidth + 2, 7, 1.2, 1.2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...colorMaroon);
  doc.text('GRAND TOTAL:', summaryX + 2, summaryY + 4.8);
  doc.text(`Rs. ${grandTotal.toFixed(2)}`, pageWidth - margin - 2, summaryY + 4.8, { align: 'right' });
  summaryY += 10;

  // ── Special Instructions (if present) ──────────────────────────────────────
  if (order.special_instruction) {
    if (summaryY > pageHeight - 35) {
      doc.addPage();
      summaryY = 14;
    }
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(...colorMuted);
    doc.text(`Special Notes: "${order.special_instruction}"`, margin, summaryY);
    summaryY += 5;
  }

  // ── Footer Section ─────────────────────────────────────────────────────────
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

  // ── Save / Download PDF ────────────────────────────────────────────────────
  const cleanOrderName = orderNum.replace(/[^a-zA-Z0-9-_]/g, '_');
  doc.save(`${cleanOrderName}-bill.pdf`);
};
