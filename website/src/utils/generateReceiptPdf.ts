import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { Order } from '../types';

/**
 * Generate and download a thermal-style PDF bill receipt for an order.
 *
 * Layout:
 *   MADURAI FOOD CORNER
 *   RESTAURANT & CATERING
 *   ----------------------------------------
 *   Contact: 9952250435 / 7708382018
 *   ----------------------------------------
 *   Order #: MFCW-21-08-009
 *   Date: <date>          Time: <time>
 *   Customer: <name>      Phone: <phone>
 *   Order Type: <type>
 *   ----------------------------------------
 *   Item table (Item | Qty | Price | Total)
 *   ----------------------------------------
 *   Subtotal:             <amt>
 *   Discount:            -<amt>
 *   GRAND TOTAL:          <amt>
 *   ----------------------------------------
 *   Payment: <method> — <status>
 *   ----------------------------------------
 *        Thank you for dining with us!
 *        9952250435 / 7708382018
 *
 * @param order   The order details object from backend
 * @param isPaid  Optional override — pass true if payment was confirmed via Cashfree redirect
 *                even if the DB payment_status hasn't been updated yet by webhook
 */
export const generateReceiptPdf = (order: Order, isPaid?: boolean): void => {
  if (!order) return;

  // ── Document setup ──────────────────────────────────────────────────────────
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5', // ~148 × 210 mm — compact bill size
  });

  const W = doc.internal.pageSize.getWidth(); // ≈ 148 mm
  const MARGIN = 10;
  const SEPARATOR = '- - - - - - - - - - - - - - - - - - - - - - - - - -';
  let y = 14;

  // ── Helper: draw a dashed separator line ────────────────────────────────────
  const separator = () => {
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(SEPARATOR, W / 2, y, { align: 'center' });
    y += 5;
  };

  // ── Helper: right-aligned label + value pair ─────────────────────────────────
  const labelValue = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    doc.text(label, W - MARGIN - 48, y);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(value, W - MARGIN, y, { align: 'right' });
    y += 5;
  };

  // ── Resolve order data ───────────────────────────────────────────────────────
  const orderNum       = order.order_number || order.id || 'N/A';
  const orderDateObj   = order.created_at ? new Date(order.created_at) : new Date();
  const dateStr        = orderDateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr        = orderDateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const customerName   = order.customers?.name || 'Valued Customer';
  const customerPhone  = order.customers?.phone || 'N/A';
  const orderType      = order.order_type
    ? order.order_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Parcel';
  const paymentMethod  = order.payment_method
    ? order.payment_method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Online';

  const dbPaymentStatus  = order.payment_status?.toLowerCase();
  const resolvedIsPaid   = isPaid || dbPaymentStatus === 'paid';
  const paymentStatusStr = resolvedIsPaid ? 'PAID' : (order.payment_status || 'Pending').toUpperCase();

  const subtotal       = Number(order.subtotal ?? order.total_amount ?? 0);
  const discountAmount = Number(order.discount_amount ?? 0);
  const grandTotal     = Number(order.total_amount ?? 0);

  // ── HEADER ───────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(120, 20, 20); // brand maroon
  doc.text('MADURAI FOOD CORNER', W / 2, y, { align: 'center' });

  y += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('RESTAURANT & CATERING', W / 2, y, { align: 'center' });

  y += 5;
  separator();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text('Contact: 9952250435 / 7708382018', W / 2, y, { align: 'center' });

  y += 5;
  separator();

  // ── ORDER META ───────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text(`Order #: ${orderNum}`, MARGIN, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${dateStr}`, MARGIN, y);
  doc.text(`Time: ${timeStr}`, W - MARGIN, y, { align: 'right' });
  y += 5;

  doc.text(`Customer: ${customerName}`, MARGIN, y);
  doc.text(`Phone: ${customerPhone}`, W - MARGIN, y, { align: 'right' });
  y += 5;

  doc.text(`Order Type: ${orderType}`, MARGIN, y);
  y += 5;

  separator();

  // ── ITEMS TABLE ──────────────────────────────────────────────────────────────
  const tableHead = [['Item', 'Qty', 'Price', 'Total']];
  const tableBody = (order.order_items || []).map((item) => {
    const name      = item.food_items?.name || item.combos?.name || item.special_offers?.title || 'Food Item';
    const qty       = String(item.quantity || 1);
    const unitPrice = `Rs.${Number(item.unit_price || 0).toFixed(2)}`;
    const lineTotal = `Rs.${Number(item.line_total ?? (Number(item.unit_price || 0) * Number(item.quantity || 1))).toFixed(2)}`;
    return [name, qty, unitPrice, lineTotal];
  });

  autoTable(doc, {
    startY: y,
    head: tableHead,
    body: tableBody,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: { top: 2, bottom: 2, left: 1, right: 1 },
      textColor: [30, 30, 30],
    },
    headStyles: {
      fillColor: [245, 240, 235],
      textColor: [120, 20, 20],
      fontStyle: 'bold',
      lineColor: [200, 200, 200],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 'auto', halign: 'left' },
      1: { cellWidth: 12, halign: 'center' },
      2: { cellWidth: 26, halign: 'right' },
      3: { cellWidth: 26, halign: 'right' },
    },
    margin: { left: MARGIN, right: MARGIN },
  });

  // Get Y after table
  y = ((doc as any).lastAutoTable?.finalY ?? y + 30) + 3;

  separator();

  // ── TOTALS ───────────────────────────────────────────────────────────────────
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  labelValue('Subtotal:', `Rs.${subtotal.toFixed(2)}`);

  if (discountAmount > 0) {
    doc.setTextColor(200, 50, 50);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Discount:', W - MARGIN - 48, y);
    doc.text(`-Rs.${discountAmount.toFixed(2)}`, W - MARGIN, y, { align: 'right' });
    doc.setTextColor(40, 40, 40);
    y += 5;
  }

  // Grand Total — larger, bold, maroon
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(120, 20, 20);
  doc.text('GRAND TOTAL:', MARGIN, y);
  doc.text(`Rs.${grandTotal.toFixed(2)}`, W - MARGIN, y, { align: 'right' });
  y += 6;

  separator();

  // ── PAYMENT STATUS ───────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  const paymentLine = `Payment: ${paymentMethod} — ${paymentStatusStr}`;
  doc.text(paymentLine, W / 2, y, { align: 'center' });
  y += 5;

  separator();

  // ── FOOTER ───────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(120, 20, 20);
  doc.text('Thank you for dining with us!', W / 2, y, { align: 'center' });

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text('9952250435 / 7708382018', W / 2, y, { align: 'center' });

  // ── Save ──────────────────────────────────────────────────────────────────────
  // File name: e.g. MFCW-21-08-009-bill.pdf
  doc.save(`${orderNum}-bill.pdf`);
};
