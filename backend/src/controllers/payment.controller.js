const paymentService = require('../services/payment.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Controller: Get all payment logs with optional filters & search
 * GET /api/payments
 */
const getPayments = asyncHandler(async (req, res) => {
  const { status, payment_gateway, payment_method, date, order_number, customer_name, search } = req.query;
  const payments = await paymentService.getAllPayments({
    status,
    payment_gateway,
    payment_method,
    date,
    order_number,
    customer_name,
    search,
  });
  res.status(200).json(new ApiResponse(200, payments, 'Payment logs retrieved successfully'));
});

/**
 * Controller: Get payment details by ID
 * GET /api/payments/:id
 */
const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPaymentById(req.params.id);
  res.status(200).json(new ApiResponse(200, payment, 'Payment details retrieved successfully'));
});

/**
 * Controller: Get payment history for one specific order ID
 * GET /api/payments/order/:orderId
 */
const getPaymentsByOrderId = asyncHandler(async (req, res) => {
  const payments = await paymentService.getPaymentsByOrderId(req.params.orderId);
  res.status(200).json(new ApiResponse(200, payments, 'Order payment history retrieved successfully'));
});

/**
 * Controller: Create new payment record and sync linked order status
 * POST /api/payments
 */
const createPayment = asyncHandler(async (req, res) => {
  const newPayment = await paymentService.createPayment(req.body);
  res.status(201).json(new ApiResponse(201, newPayment, 'Payment recorded successfully'));
});

/**
 * Controller: Update payment status (Pending, Paid, Failed, Refunded, Cancelled)
 * PATCH /api/payments/:id/status
 */
const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const updatedPayment = await paymentService.updatePaymentStatus(req.params.id, status);
  res.status(200).json(new ApiResponse(200, updatedPayment, 'Payment status updated successfully'));
});

module.exports = {
  getPayments,
  getPaymentById,
  getPaymentsByOrderId,
  createPayment,
  updatePaymentStatus,
};
