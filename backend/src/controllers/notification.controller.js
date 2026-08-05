const notificationService = require('../services/notification.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Controller: Get notification history logs
 * GET /api/notifications
 */
const getNotifications = asyncHandler(async (req, res) => {
  const { channel, status, event, date, recipient, search } = req.query;
  const logs = await notificationService.getAllNotifications({ channel, status, event, date, recipient, search });
  res.status(200).json(new ApiResponse(200, logs, 'Notification history retrieved successfully'));
});

/**
 * Controller: Get single notification details by ID
 * GET /api/notifications/:id
 */
const getNotificationById = asyncHandler(async (req, res) => {
  const log = await notificationService.getNotificationById(req.params.id);
  res.status(200).json(new ApiResponse(200, log, 'Notification details retrieved successfully'));
});

/**
 * Controller: Send manual notification
 * POST /api/notifications/send
 */
const sendNotification = asyncHandler(async (req, res) => {
  const result = await notificationService.sendNotification(req.body);
  res.status(201).json(new ApiResponse(201, result, 'Notification sent successfully.'));
});

/**
 * Controller: Send test notification
 * POST /api/notifications/test
 */
const sendTestNotification = asyncHandler(async (req, res) => {
  const result = await notificationService.sendTestNotification(req.body);
  res.status(200).json(new ApiResponse(200, result, 'Test notification dispatched successfully.'));
});

/**
 * Controller: Retry failed notification
 * POST /api/notifications/retry/:id
 */
const retryNotification = asyncHandler(async (req, res) => {
  const result = await notificationService.retryNotification(req.params.id);
  res.status(200).json(new ApiResponse(200, result, 'Notification retry processed successfully.'));
});

module.exports = {
  getNotifications,
  getNotificationById,
  sendNotification,
  sendTestNotification,
  retryNotification,
};
