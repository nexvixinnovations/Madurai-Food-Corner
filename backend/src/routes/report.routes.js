const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');

/**
 * Routes for /api/reports
 */

// GET sales summary report
router.get('/sales', reportController.getSalesReport);

// GET order transactions report (paginated)
router.get('/orders', reportController.getOrdersReport);

// GET customer analytics report
router.get('/customers', reportController.getCustomersReport);

// GET food item sales report
router.get('/foods', reportController.getFoodSalesReport);

// GET combo sales report
router.get('/combos', reportController.getComboSalesReport);

// GET payment log report
router.get('/payments', reportController.getPaymentsReport);

// GET GST tax report
router.get('/tax', reportController.getTaxReport);

// GET export report as PDF, Excel (.xls), or CSV download
router.get('/export', reportController.exportReport);

module.exports = router;
