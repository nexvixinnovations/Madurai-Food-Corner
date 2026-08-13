const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

/**
 * Routes for /api/payments
 */

// POST create Cashfree payment session
router.post('/cashfree/session', paymentController.createCashfreeSession);

// POST verify Cashfree payment status
router.post('/cashfree/verify', paymentController.verifyCashfreePayment);

// POST Cashfree webhook notifications (Server-to-Server)
router.post('/webhook', paymentController.handleCashfreeWebhook);

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
