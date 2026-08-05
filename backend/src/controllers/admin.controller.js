const dashboardService = require('../services/dashboard.service');
const orderService = require('../services/order.service');
const foodService = require('../services/food.service');
const menuService = require('../services/menu.service');
const comboService = require('../services/combo.service');
const offerService = require('../services/offer.service');
const paymentService = require('../services/payment.service');
const reportService = require('../services/report.service');
const { settingsService } = require('../services/settings.service');
const notificationService = require('../services/notification.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Controller: Get Admin Dashboard Summary
 * GET /api/admin/dashboard
 */
const getDashboardSummary = asyncHandler(async (req, res) => {
  const { period, start_date, end_date } = req.query;
  const data = await dashboardService.getDashboardData({ period, start_date, end_date });
  res.status(200).json(new ApiResponse(200, data, 'Admin dashboard summary retrieved successfully'));
});

/**
 * Controller: Get Orders List for Admin
 * GET /api/admin/orders
 */
const getOrdersList = asyncHandler(async (req, res) => {
  const { status, payment_status, required_date, order_source, phone, name, search } = req.query;
  const orders = await orderService.getAllOrders({ status, payment_status, required_date, order_source, phone, name, search });
  res.status(200).json(new ApiResponse(200, orders, 'Admin orders list retrieved successfully'));
});

/**
 * Controller: Get Foods Catalog for Admin
 * GET /api/admin/foods
 */
const getFoodsList = asyncHandler(async (req, res) => {
  const { search, category, food_type, available, sort } = req.query;
  const foods = await foodService.getAllFoods({ search, category, food_type, available, sort });
  res.status(200).json(new ApiResponse(200, foods, 'Food catalog retrieved successfully'));
});

/**
 * Controller: Get Menu Schedule for Admin
 * GET /api/admin/menu
 */
const getMenuSchedule = asyncHandler(async (req, res) => {
  const { date, search, category } = req.query;
  const menu = await menuService.getMenuByDate(date, { search, category });
  res.status(200).json(new ApiResponse(200, menu, 'Menu schedule retrieved successfully'));
});

/**
 * Controller: Get Combos List for Admin
 * GET /api/admin/combos
 */
const getCombosList = asyncHandler(async (req, res) => {
  const { search, available, offer_enabled } = req.query;
  const combos = await comboService.getAllCombos({ search, available, offer_enabled });
  res.status(200).json(new ApiResponse(200, combos, 'Combos list retrieved successfully'));
});

/**
 * Controller: Get Special Offers List for Admin
 * GET /api/admin/offers
 */
const getOffersList = asyncHandler(async (req, res) => {
  const { search, available, active } = req.query;
  const offers = await offerService.getAllOffers({ search, available, active });
  res.status(200).json(new ApiResponse(200, offers, 'Special offers list retrieved successfully'));
});

/**
 * Controller: Get Payments List for Admin
 * GET /api/admin/payments
 */
const getPaymentsList = asyncHandler(async (req, res) => {
  const { status, payment_gateway, payment_method, date, order_number, customer_name, search } = req.query;
  const payments = await paymentService.getAllPayments({ status, payment_gateway, payment_method, date, order_number, customer_name, search });
  res.status(200).json(new ApiResponse(200, payments, 'Payment logs retrieved successfully'));
});

/**
 * Controller: Get Reports Summary for Admin
 * GET /api/admin/reports
 */
const getReportsSummary = asyncHandler(async (req, res) => {
  const { preset, start_date, end_date, type = 'overview' } = req.query;
  let data;
  if (type === 'overview') data = await reportService.getBusinessOverviewReports();
  else if (type === 'orders') data = await reportService.getOrdersReport({ preset, start_date, end_date });
  else if (type === 'customers') data = await reportService.getCustomersReport({ preset, start_date, end_date });
  else if (type === 'foods') data = await reportService.getFoodSalesReport({ preset, start_date, end_date });
  else if (type === 'combos') data = await reportService.getComboSalesReport({ preset, start_date, end_date });
  else if (type === 'payments') data = await reportService.getPaymentsReport({ preset, start_date, end_date });
  else if (type === 'tax') data = await reportService.getTaxReport({ preset, start_date, end_date });
  else data = await reportService.getSalesReport({ preset, start_date, end_date });

  res.status(200).json(new ApiResponse(200, data, 'Admin report summary retrieved successfully'));
});

/**
 * Controller: Get Settings for Admin
 * GET /api/admin/settings
 */
const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getRestaurantSettings();
  res.status(200).json(new ApiResponse(200, settings, 'Admin restaurant settings retrieved successfully'));
});

/**
 * Controller: Get Notifications List for Admin
 * GET /api/admin/notifications
 */
const getNotifications = asyncHandler(async (req, res) => {
  const { channel, status, event, date, recipient, search } = req.query;
  const notifications = await notificationService.getAllNotifications({ channel, status, event, date, recipient, search });
  res.status(200).json(new ApiResponse(200, notifications, 'Admin notification history retrieved successfully'));
});

module.exports = {
  getDashboardSummary,
  getOrdersList,
  getFoodsList,
  getMenuSchedule,
  getCombosList,
  getOffersList,
  getPaymentsList,
  getReportsSummary,
  getSettings,
  getNotifications,
};
