const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller');

/**
 * Routes for /api/health
 */

// GET System Health Status
router.get('/', healthController.getHealthStatus);

module.exports = router;
