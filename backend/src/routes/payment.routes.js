const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { sensitiveRateLimiter } = require('../middleware/security.middleware');

/**
 * Routes for /api/payments
 */

// POST create Cashfree payment session (Protected by sensitive rate limiter)
router.post('/cashfree/session', sensitiveRateLimiter, paymentController.createCashfreeSession);

// POST verify Cashfree payment status
router.post('/cashfree/verify', paymentController.verifyCashfreePayment);

// POST Cashfree webhook notifications (Server-to-Server)
router.post('/webhook', paymentController.handleCashfreeWebhook);

// Explicitly reject all non-POST methods on /webhook to prevent the /:id
// wildcard from matching (e.g. GET /webhook would otherwise pass the string
// "webhook" into prisma.payments.findUnique({ where: { id: UUID } }) causing
// a Prisma UUID parse error and a 500 response).
router.all('/webhook', (req, res) => {
  res.status(405).json({
    success: false,
    message: `Method Not Allowed. ${req.method} is not supported on this endpoint. Cashfree webhook notifications must be sent as POST requests.`,
  });
});

// GET all payments with optional filters & search
router.get('/', paymentController.getPayments);

// GET payment history for specific order ID (placed before /:id)
router.get('/order/:orderId', paymentController.getPaymentsByOrderId);

// GET payment details by ID
router.get('/:id', paymentController.getPaymentById);

// POST create new payment record
router.post('/', paymentController.createPayment);

// PATCH update payment status (Pending, Paid, Failed, Refunded, Cancelled)
router.patch('/:id/status', paymentController.updatePaymentStatus);

module.exports = router;
