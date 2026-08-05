const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');

/**
 * Routes for /api/notifications
 */

// GET notification history logs (supports channel, status, event, date, recipient, search)
router.get('/', notificationController.getNotifications);

// POST send manual notification
router.post('/send', notificationController.sendNotification);

// POST send test notification
router.post('/test', notificationController.sendTestNotification);

// POST retry failed notification by ID (placed before /:id)
router.post('/retry/:id', notificationController.retryNotification);

// GET single notification by ID
router.get('/:id', notificationController.getNotificationById);

module.exports = router;
