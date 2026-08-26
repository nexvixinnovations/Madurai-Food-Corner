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
/**
 * Controller: Verify Cashfree Payment status directly from Cashfree PG API
 * POST /api/payments/cashfree/verify or GET/POST /api/website/payments/verify/:orderNumber?
 */
const verifyCashfreePayment = asyncHandler(async (req, res) => {
  const targetId = req.body?.order_id || req.params?.orderNumber || req.params?.orderId || req.query?.order_id;

  if (!targetId) {
    throw new ApiError(400, 'order_id or orderNumber is required for Cashfree payment verification');
  }

  const cleanId = String(targetId).trim();

  // 1. Locate order in database first
  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(cleanId);
  const whereCond = isUuid
    ? {
        OR: [
          { id: cleanId },
          { order_number: { equals: cleanId, mode: 'insensitive' } },
        ],
      }
    : { order_number: { equals: cleanId, mode: 'insensitive' } };

  const targetOrder = await prisma.orders.findFirst({
    where: whereCond,
  });

  const cashfreeOrderId = targetOrder?.order_number || cleanId;

  // 2. Fetch authoritative status from Cashfree PG API
  let cfOrder = null;
  let cfPayments = [];

  try {
    cfOrder = await cashfreeService.getOrderDetails(cashfreeOrderId);
  } catch (err) {
    // If not found by order_number and cleanId is different, try cleanId
    if (cleanId !== cashfreeOrderId) {
      try {
        cfOrder = await cashfreeService.getOrderDetails(cleanId);
      } catch (_) {}
    }
  }

  try {
    cfPayments = await cashfreeService.getOrderPayments(cashfreeOrderId);
  } catch (_) {
    cfPayments = [];
  }

  const hasSuccessfulPayment =
    cfOrder?.order_status === 'PAID' ||
    (Array.isArray(cfPayments) && cfPayments.some((p) => p.payment_status === 'SUCCESS'));

  const hasFailedPayment =
    cfOrder?.order_status === 'FAILED' ||
    cfOrder?.order_status === 'CANCELLED' ||
    cfOrder?.order_status === 'EXPIRED' ||
    (Array.isArray(cfPayments) && cfPayments.length > 0 && cfPayments.every((p) => ['FAILED', 'USER_DROPPED', 'CANCELLED'].includes(p.payment_status)));

  if (hasSuccessfulPayment) {
    if (targetOrder) {
      await paymentService.createPayment({
        order_id: targetOrder.id,
        transaction_id: cfOrder?.cf_order_id || (Array.isArray(cfPayments) && cfPayments[0]?.cf_payment_id) || `CF_${cleanId}`,
        payment_gateway: 'Cashfree',
        payment_method: (Array.isArray(cfPayments) && cfPayments[0]?.payment_group) || 'Online',
        amount: cfOrder?.order_amount || targetOrder.total_amount,
        status: 'Paid',
      });
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          verified: true,
          paid: true,
          status: 'PAID',
          order_number: targetOrder?.order_number || cleanId,
          cfOrder,
          payments: cfPayments,
        },
        'Payment verified successfully as PAID'
      )
    );
  }

  if (hasFailedPayment) {
    if (targetOrder) {
      await prisma.orders.update({
        where: { id: targetOrder.id },
        data: {
          payment_status: 'Failed',
          status: targetOrder.status === 'Accepted' ? 'Pending' : targetOrder.status,
        },
      });

      const latestPayment = await prisma.payments.findFirst({
        where: { order_id: targetOrder.id },
        orderBy: { id: 'desc' },
      });

      if (latestPayment) {
        await prisma.payments.update({
          where: { id: latestPayment.id },
          data: { status: 'Failed' },
        });
      }
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          verified: true,
          paid: false,
          status: 'FAILED',
          order_number: targetOrder?.order_number || cleanId,
          cfOrder,
          payments: cfPayments,
        },
        'Payment has failed or was cancelled.'
      )
    );
  }

  // If still ACTIVE / PENDING
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        verified: true,
        paid: false,
        status: cfOrder?.order_status || 'PENDING',
        order_number: targetOrder?.order_number || cleanId,
        cfOrder,
        payments: cfPayments,
      },
      'Payment is currently pending verification.'
    )
  );
});

/**
 * Controller: Handle Cashfree Webhook Notifications (Server-to-Server)
 * POST /api/payments/webhook
 */
const handleCashfreeWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-webhook-signature'] || req.headers['x-signature'];
  const timestamp = req.headers['x-webhook-timestamp'] || req.headers['x-timestamp'];
  const rawBody = req.rawBody || JSON.stringify(req.body);

  // Validate HMAC-SHA256 Signature
  if (process.env.NODE_ENV === 'production' || signature) {
    const isValid = cashfreeService.verifyWebhookSignature(signature, rawBody, timestamp);
    if (!isValid) {
      console.warn('[CASHFREE WEBHOOK SECURITY ALERT] Rejected webhook with invalid signature');
      throw new ApiError(401, 'Unauthorized: Invalid Cashfree Webhook Signature');
    }
  }

  console.log('[CASHFREE WEBHOOK VERIFIED]', JSON.stringify(req.body));

  const eventType = req.body?.type || req.body?.event;
  const orderData = req.body?.data?.order || req.body?.data;
  const paymentData = req.body?.data?.payment;

  if (orderData && orderData.order_id) {
    const orderId = String(orderData.order_id).trim();
    const isSuccess =
      eventType === 'PAYMENT_SUCCESS_WEBHOOK' ||
      req.body?.data?.payment?.payment_status === 'SUCCESS';

    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(orderId);
    const whereCond = isUuid
      ? {
          OR: [
            { id: orderId },
            { order_number: { equals: orderId, mode: 'insensitive' } },
          ],
        }
      : { order_number: { equals: orderId, mode: 'insensitive' } };

    const targetOrder = await prisma.orders.findFirst({
      where: whereCond,
    });

    if (targetOrder) {
      if (isSuccess) {
        await paymentService.createPayment({
          order_id: targetOrder.id,
          transaction_id: paymentData?.cf_payment_id || `CF_${orderId}`,
          payment_gateway: 'Cashfree',
          payment_method: paymentData?.payment_group || 'Online',
          amount: orderData.order_amount || targetOrder.total_amount,
          status: 'Paid',
        });
        console.log(`[CASHFREE WEBHOOK PROCESSED] Order #${orderId} marked as Paid`);
      } else {
        await prisma.orders.update({
          where: { id: targetOrder.id },
          data: { payment_status: 'Failed' },
        });
        console.log(`[CASHFREE WEBHOOK PROCESSED] Order #${orderId} marked as Failed`);
      }
    }
  }

  res.status(200).json({ status: 'OK', message: 'Webhook processed successfully' });
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

