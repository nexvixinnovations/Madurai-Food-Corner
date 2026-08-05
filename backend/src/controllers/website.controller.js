const menuService = require('../services/menu.service');
const comboService = require('../services/combo.service');
const offerService = require('../services/offer.service');
const orderService = require('../services/order.service');
const { settingsService } = require('../services/settings.service');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Controller: Get Today's Available Menu with food details
 * GET /api/website/menu
 */
const getTodayMenu = asyncHandler(async (req, res) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const search = req.query.search;
  const category = req.query.category;

  const menu = await menuService.getMenuByDate({ date: todayStr, search, category });
  res.status(200).json(new ApiResponse(200, menu, "Today's scheduled menu retrieved successfully"));
});

/**
 * Controller: Get Available Combo Meals
 * GET /api/website/combos
 */
const getCombos = asyncHandler(async (req, res) => {
  const combos = await comboService.getAllCombos({ available: true });
  res.status(200).json(new ApiResponse(200, combos, 'Available combo meals retrieved successfully'));
});

/**
 * Controller: Get Active Promotional Offers
 * GET /api/website/offers
 */
const getActiveOffers = asyncHandler(async (req, res) => {
  const offers = await offerService.getAllOffers({ active: true });
  res.status(200).json(new ApiResponse(200, offers, 'Active promotional offers retrieved successfully'));
});

const orderingWindowService = require('../services/orderingWindow.service');

/**
 * Controller: Get Ordering Window Status & Banner Info
 * GET /api/website/ordering-status
 */
const getOrderingStatus = asyncHandler(async (req, res) => {
  const targetDate = req.query.date;
  const status = await orderingWindowService.getOrderingStatus(targetDate);
  res.status(200).json(new ApiResponse(200, status, 'Ordering window status retrieved successfully'));
});

/**
 * Controller: Place Customer Order
 * POST /api/website/orders
 */
const placeOrder = asyncHandler(async (req, res) => {
  req.body.order_source = 'website';
  const newOrder = await orderService.createOrder(req.body);
  res.status(201).json(new ApiResponse(201, newOrder, 'Order placed successfully'));
});

/**
 * Controller: Track Order by Order Number or ID
 * GET /api/website/orders/track/:orderNumber
 */
const trackOrder = asyncHandler(async (req, res) => {
  const identifier = req.params.orderNumber;
  if (!identifier) {
    throw new ApiError(400, 'Order number or ID parameter is required.');
  }

  // Try finding order by order_number search or ID
  const orders = await orderService.getAllOrders({ search: identifier });

  let targetOrder = orders.find(
    (o) => o.order_number.toLowerCase() === identifier.toLowerCase() || o.id === identifier
  );

  if (!targetOrder && orders.length > 0) {
    targetOrder = orders[0];
  }

  if (!targetOrder) {
    throw new ApiError(404, `No order found with number or ID '${identifier}'.`);
  }

  res.status(200).json(new ApiResponse(200, targetOrder, 'Order tracking details retrieved successfully'));
});

/**
 * Controller: Get Restaurant Information, Timings & Operational Toggles
 * GET /api/website/restaurant-info
 */
const getRestaurantInfo = asyncHandler(async (req, res) => {
  const settings = await settingsService.getRestaurantSettings();
  res.status(200).json(new ApiResponse(200, settings, 'Restaurant information retrieved successfully'));
});

module.exports = {
  getTodayMenu,
  getCombos,
  getActiveOffers,
  getOrderingStatus,
  placeOrder,
  trackOrder,
  getRestaurantInfo,
};
