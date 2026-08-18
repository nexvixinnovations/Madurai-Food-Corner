import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order } from '../types';

/**
 * Generate and download a clean, thermal-style PDF bill receipt for an order
 * @param order The order details object from backend
 */
export const generateReceiptPdf = (order: Order): void => {
  if (!order) return;

  // Create a portrait A5 PDF document for a compact bill receipt
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // ~148mm for A5
  let y = 12;

  // Title & Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(120, 20, 20); // Brand Maroon
  doc.text('MADURAI FOOD CORNER', pageWidth / 2, y, { align: 'center' });

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Taste the Pride of Madurai', pageWidth / 2, y, { align: 'center' });

  y += 4;
  doc.text('www.maduraifoodcorner.com | +91 99999 99999', pageWidth / 2, y, { align: 'center' });

  // Divider Line
  y += 5;
  doc.setLineWidth(0.4);
  doc.setDrawColor(180, 180, 180);
  doc.line(10, y, pageWidth - 10, y);

  // Order Details Header Section
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);

  const orderNum = order.order_number || order.id || 'N/A';
  const orderDateObj = order.created_at ? new Date(order.created_at) : new Date();
  const dateStr = orderDateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = orderDateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const customerName = order.customers?.name || 'Valued Customer';
  const customerPhone = order.customers?.phone || 'N/A';
  const orderType = order.order_type || 'Parcel';
  const paymentMethod = order.payment_method || 'Online';
  const paymentStatus = (order.payment_status || 'Paid').toUpperCase();

  doc.setFont('helvetica', 'bold');
  doc.text(`Order No: ${orderNum}`, 10, y);
  doc.text(`Date: ${dateStr}  ${timeStr}`, pageWidth - 10, y, { align: 'right' });

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Customer: ${customerName}`, 10, y);
  doc.text(`Phone: ${customerPhone}`, pageWidth - 10, y, { align: 'right' });

  y += 5;
  doc.text(`Order Type: ${orderType}`, 10, y);
  doc.text(`Payment: ${paymentMethod} (${paymentStatus})`, pageWidth - 10, y, { align: 'right' });

  // Divider Line
  y += 4;
  doc.line(10, y, pageWidth - 10, y);

  // Itemized Table
  const tableHead = [['Item Description', 'Qty', 'Unit Price', 'Total']];
  const tableBody = (order.order_items || []).map((item) => {
    const name = item.food_items?.name || item.combos?.name || item.special_offers?.title || 'Food Item';
    const qty = String(item.quantity || 1);
    const unitPrice = `Rs. ${Number(item.unit_price || 0).toFixed(2)}`;
    const lineTotal = `Rs. ${Number(item.line_total || 0).toFixed(2)}`;
    return [name, qty, unitPrice, lineTotal];
  });

  autoTable(doc, {
    startY: y + 2,
    head: tableHead,
    body: tableBody,
    theme: 'plain',
    styles: {
      fontSize: 8.5,
      cellPadding: 2,
      textColor: [30, 30, 30],
    },
    headStyles: {
      fillColor: [245, 240, 235],
      textColor: [120, 20, 20],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 15 },
      2: { halign: 'right', cellWidth: 25 },
      3: { halign: 'right', cellWidth: 25 },
    },
    margin: { left: 10, right: 10 },
  });

  // Get final Y position after table
  const finalY = (doc as any).lastAutoTable?.finalY || y + 30;
  y = finalY + 4;

  // Financial Totals Section
  doc.line(10, y, pageWidth - 10, y);
  y += 5;

  const subtotal = Number(order.subtotal || order.total_amount || 0).toFixed(2);
  const discountAmount = Number(order.discount_amount || 0).toFixed(2);
  const grandTotal = Number(order.total_amount || 0).toFixed(2);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', pageWidth - 45, y);
  doc.text(`Rs. ${subtotal}`, pageWidth - 10, y, { align: 'right' });

  if (Number(discountAmount) > 0) {
    y += 4.5;
    doc.setTextColor(200, 50, 50);
    doc.text('Discount:', pageWidth - 45, y);
    doc.text(`-Rs. ${discountAmount}`, pageWidth - 10, y, { align: 'right' });
    doc.setTextColor(40, 40, 40);
  }

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(120, 20, 20);
  doc.text('GRAND TOTAL:', pageWidth - 45, y);
  doc.text(`Rs. ${grandTotal}`, pageWidth - 10, y, { align: 'right' });

  // Divider & Footer
  y += 6;
  doc.setLineWidth(0.4);
  doc.setDrawColor(180, 180, 180);
  doc.line(10, y, pageWidth - 10, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text('Thank you for your order!', pageWidth / 2, y, { align: 'center' });

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('We look forward to serving you again at Madurai Food Corner!', pageWidth / 2, y, { align: 'center' });

  // Trigger File Download
  const fileName = `${orderNum}-receipt.pdf`;
  doc.save(fileName);
};
