const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

/**
 * Routes for /api/orders
 */

// GET all orders with optional search, status, payment_status, required_date, customer filters
router.get('/', orderController.getOrders);

// GET complete order by ID
router.get('/:id', orderController.getOrderById);

// POST create new order
router.post('/', orderController.createOrder);

// PUT update order details
router.put('/:id', orderController.updateOrder);

// DELETE order and associated items/payments
router.delete('/:id', orderController.deleteOrder);

// PATCH update order status (Pending, Accepted, Preparing, Ready, Completed, Cancelled)
router.patch('/:id/status', orderController.updateOrderStatus);

module.exports = router;
