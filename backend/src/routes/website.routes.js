const express = require('express');
const router = express.Router();
const websiteController = require('../controllers/website.controller');
const orderingCalendarController = require('../controllers/orderingCalendar.controller');

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

// POST Place Order
router.post('/orders', websiteController.placeOrder);

// GET Track Order by Order Number or ID
router.get('/orders/track/:orderNumber', websiteController.trackOrder);

// GET Restaurant Information & Business Timings
router.get('/restaurant-info', websiteController.getRestaurantInfo);

// GET Ordering Calendar Closed Dates (Public)
router.get('/ordering-calendar', orderingCalendarController.getWebsiteCalendar);

module.exports = router;
