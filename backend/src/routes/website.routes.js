const express = require('express');
const router = express.Router();
const websiteController = require('../controllers/website.controller');
const orderingCalendarController = require('../controllers/orderingCalendar.controller');
const paymentController = require('../controllers/payment.controller');
const { sensitiveRateLimiter } = require('../middleware/security.middleware');

/**
 * Routes for Customer Website API (/api/website)
 */

// GET Today's Scheduled Menu
router.get('/menu', websiteController.getTodayMenu);

// GET Available Combos
router.get('/combos', websiteController.getCombos);

// GET Active Promotional Offers
router.get('/offers', websiteController.getActiveOffers);

// GET Ordering Time Window Status
router.get('/ordering-status', websiteController.getOrderingStatus);

// POST Place Order (Protected by sensitive rate limiter)
router.post('/orders', sensitiveRateLimiter, websiteController.placeOrder);

// GET Track Order by Order Number or ID
router.get('/orders/track/:orderNumber', websiteController.trackOrder);

// GET / POST Verify Cashfree Payment by Order Number directly from Cashfree API
router.get('/orders/verify/:orderNumber', paymentController.verifyCashfreePayment);
router.get('/payments/verify/:orderNumber', paymentController.verifyCashfreePayment);
router.post('/payments/verify', paymentController.verifyCashfreePayment);

// GET Restaurant Information & Business Timings
router.get('/restaurant-info', websiteController.getRestaurantInfo);

// GET Ordering Calendar Closed Dates (Public)
router.get('/ordering-calendar', orderingCalendarController.getWebsiteCalendar);

// POST Create Cashfree Payment Session for Website Order (Protected by sensitive rate limiter)
router.post('/payments/create-session', sensitiveRateLimiter, paymentController.createCashfreeSession);

module.exports = router;
