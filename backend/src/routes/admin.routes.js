const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

/**
 * Routes for Android Admin App & Admin Web Panel (/api/admin)
 */

// GET Dashboard Summary
router.get('/dashboard', adminController.getDashboardSummary);

// GET Orders List
router.get('/orders', adminController.getOrdersList);

const foodController = require('../controllers/food.controller');
const upload = require('../middleware/upload.middleware');

// GET Foods Catalog & Availability Management
router.get('/foods', adminController.getFoodsList);
router.post('/foods', upload.single('image'), foodController.createFood);
router.put('/foods/bulk-availability', foodController.bulkUpdateAvailability);
router.patch('/foods/:id/status', foodController.toggleFoodStatus);
router.put('/foods/:id', upload.single('image'), foodController.updateFood);
router.delete('/foods/:id', foodController.deleteFood);

// GET Menu Schedule
router.get('/menu', adminController.getMenuSchedule);

// GET Combos List
router.get('/combos', adminController.getCombosList);

// GET Special Offers List
router.get('/offers', adminController.getOffersList);

// GET Payments List
router.get('/payments', adminController.getPaymentsList);

// GET Reports Summary
router.get('/reports', adminController.getReportsSummary);

const settingsController = require('../controllers/settings.controller');
const orderingCalendarController = require('../controllers/orderingCalendar.controller');

// GET & PUT Restaurant Settings
router.get('/settings', adminController.getSettings);
router.put('/settings', settingsController.updateSettings);

// GET & PUT Ordering Calendar
router.get('/ordering-calendar', orderingCalendarController.getAdminCalendar);
router.put('/ordering-calendar', orderingCalendarController.updateAdminCalendar);

// GET Notifications History
router.get('/notifications', adminController.getNotifications);

module.exports = router;
