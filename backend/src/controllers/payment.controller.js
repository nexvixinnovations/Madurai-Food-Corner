const paymentService = require('../services/payment.service');
const cashfreeService = require('../services/cashfree.service');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../config/prisma');

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

/**
 * Controller: Create Cashfree Payment Session for an order
 * POST /api/payments/cashfree/session or POST /api/website/payments/create-session
 */
const createCashfreeSession = asyncHandler(async (req, res) => {
  const { order_id, order_number, amount, customer_name, customer_phone, customer_email, return_url } = req.body;

  let targetOrder = null;
  const searchId = order_id || order_number;

  if (searchId) {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(String(searchId));
    const whereConditions = [{ order_number: String(searchId) }];
    if (isUuid) {
      whereConditions.push({ id: String(searchId) });
    }

    targetOrder = await prisma.orders.findFirst({
      where: { OR: whereConditions },
      include: { customers: true },
    });
  }

  const finalOrderId = targetOrder ? targetOrder.order_number : (order_number || order_id || `ORD_${Date.now()}`);
  const finalAmount = targetOrder && targetOrder.total_amount ? Number(targetOrder.total_amount) : Number(amount);
  const finalCustomerName = targetOrder?.customers?.name || customer_name || 'Customer';
  const finalCustomerPhone = targetOrder?.customers?.phone || customer_phone || '9999999999';
  const finalCustomerEmail = targetOrder?.customers?.email || customer_email || undefined;

  if (!finalAmount || isNaN(finalAmount) || finalAmount <= 0) {
    throw new ApiError(400, 'Valid order amount is required to initiate Cashfree payment');
  }

  const sessionData = await cashfreeService.createPaymentSession({
    orderId: finalOrderId,
    amount: finalAmount,
    customerName: finalCustomerName,
    customerPhone: finalCustomerPhone,
    customerEmail: finalCustomerEmail,
    returnUrl: return_url,
  });

  res.status(200).json(new ApiResponse(200, sessionData, 'Cashfree payment session created successfully'));
});

/**
 * Controller: Verify Cashfree Payment status directly
 * POST /api/payments/cashfree/verify
 */
const verifyCashfreePayment = asyncHandler(async (req, res) => {
  const { order_id } = req.body;

  if (!order_id) {
    throw new ApiError(400, 'order_id is required for Cashfree payment verification');
  }

  const cfOrder = await cashfreeService.getOrderDetails(order_id);

  if (cfOrder && cfOrder.order_status === 'PAID') {
    const targetOrder = await prisma.orders.findFirst({
      where: {
        OR: [
          { id: String(order_id) },
          { order_number: String(order_id) },
        ],
      },
    });

    if (targetOrder) {
      await paymentService.createPayment({
        order_id: targetOrder.id,
        transaction_id: cfOrder.cf_order_id || `CF_${order_id}`,
        payment_gateway: 'Cashfree',
        payment_method: 'Online',
        amount: cfOrder.order_amount,
        status: 'Paid',
      });
    }

    return res.status(200).json(new ApiResponse(200, { paid: true, status: 'PAID', cfOrder }, 'Payment verified successfully as PAID'));
  }

  res.status(200).json(new ApiResponse(200, { paid: false, status: cfOrder?.order_status || 'PENDING', cfOrder }, 'Payment verification completed'));
});

/**
 * Controller: Handle Cashfree Webhook Notifications (Server-to-Server)
 * POST /api/payments/webhook
 */
const handleCashfreeWebhook = asyncHandler(async (req, res) => {
  console.log('[CASHFREE WEBHOOK RECEIVED]', JSON.stringify(req.body));

  const eventType = req.body?.type || req.body?.event;
  const orderData = req.body?.data?.order || req.body?.data;
  const paymentData = req.body?.data?.payment;

  if (orderData && orderData.order_id) {
    const orderId = orderData.order_id;
    const isSuccess = eventType === 'PAYMENT_SUCCESS_WEBHOOK' || req.body?.data?.payment?.payment_status === 'SUCCESS';

    const targetOrder = await prisma.orders.findFirst({
      where: {
        OR: [
          { id: String(orderId) },
          { order_number: String(orderId) },
        ],
      },
    });

    if (targetOrder) {
      await paymentService.createPayment({
        order_id: targetOrder.id,
        transaction_id: paymentData?.cf_payment_id || `CF_${orderId}`,
        payment_gateway: 'Cashfree',
        payment_method: paymentData?.payment_group || 'Online',
        amount: orderData.order_amount || targetOrder.total_amount,
        status: isSuccess ? 'Paid' : 'Failed',
      });
      console.log(`[CASHFREE WEBHOOK PROCESSED] Order #${orderId} marked as ${isSuccess ? 'Paid' : 'Failed'}`);
    }
  }

  res.status(200).json({ status: 'OK', message: 'Webhook received' });
});

module.exports = {
  getPayments,
  getPaymentById,
  getPaymentsByOrderId,
  createPayment,
  updatePaymentStatus,
  createCashfreeSession,
  verifyCashfreePayment,
  handleCashfreeWebhook,
};

