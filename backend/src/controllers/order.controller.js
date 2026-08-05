const orderService = require('../services/order.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Controller: Get all orders with filters (status, payment_status, required_date, source, search)
 * GET /api/orders
 */
const getOrders = asyncHandler(async (req, res) => {
  const { status, payment_status, required_date, order_source, phone, name, search } = req.query;
  const orders = await orderService.getAllOrders({
    status,
    payment_status,
    required_date,
    order_source,
    phone,
    name,
    search,
  });
  res.status(200).json(new ApiResponse(200, orders, 'Orders retrieved successfully'));
});

/**
 * Controller: Get complete order by ID
 * GET /api/orders/:id
 */
const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id);
  res.status(200).json(new ApiResponse(200, order, 'Order details retrieved successfully'));
});

/**
 * Controller: Create new customer order with automatic pricing calculations & transaction
 * POST /api/orders
 */
const createOrder = asyncHandler(async (req, res) => {
  const newOrder = await orderService.createOrder(req.body);
  res.status(201).json(new ApiResponse(201, newOrder, 'Order created successfully'));
});

/**
 * Controller: Update existing order details
 * PUT /api/orders/:id
 */
const updateOrder = asyncHandler(async (req, res) => {
  const updatedOrder = await orderService.updateOrder(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, updatedOrder, 'Order updated successfully'));
});

/**
 * Controller: Delete order and associated line items & payment records
 * DELETE /api/orders/:id
 */
const deleteOrder = asyncHandler(async (req, res) => {
  await orderService.deleteOrder(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Order deleted successfully'));
});

/**
 * Controller: Update order status (Pending, Accepted, Preparing, Ready, Completed, Cancelled)
 * PATCH /api/orders/:id/status
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const updatedOrder = await orderService.updateOrderStatus(req.params.id, status);
  res.status(200).json(new ApiResponse(200, updatedOrder, 'Order status updated successfully'));
});

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
};
