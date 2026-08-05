const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');

/**
 * Routes for /api/dashboard
 */

// GET complete real-time dashboard analytics (supports period, start_date, end_date query filters)
router.get('/', dashboardController.getDashboard);

module.exports = router;
