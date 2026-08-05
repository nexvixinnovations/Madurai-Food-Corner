const reportService = require('../services/report.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Controller: Get Sales Report
 * GET /api/reports/sales
 */
const getSalesReport = asyncHandler(async (req, res) => {
  const { preset, start_date, end_date, payment_method, order_type, status } = req.query;
  const report = await reportService.getSalesReport({ preset, start_date, end_date, payment_method, order_type, status });
  res.status(200).json(new ApiResponse(200, report, 'Sales report generated successfully'));
});

/**
 * Controller: Get Orders Report (Paginated)
 * GET /api/reports/orders
 */
const getOrdersReport = asyncHandler(async (req, res) => {
  const { preset, start_date, end_date, search, page, limit } = req.query;
  const report = await reportService.getOrdersReport({ preset, start_date, end_date, search, page, limit });
  res.status(200).json(new ApiResponse(200, report, 'Orders report generated successfully'));
});

/**
 * Controller: Get Customers Report
 * GET /api/reports/customers
 */
const getCustomersReport = asyncHandler(async (req, res) => {
  const { preset, start_date, end_date, search } = req.query;
  const report = await reportService.getCustomersReport({ preset, start_date, end_date, search });
  res.status(200).json(new ApiResponse(200, report, 'Customers report generated successfully'));
});

/**
 * Controller: Get Food Sales Report
 * GET /api/reports/foods
 */
const getFoodSalesReport = asyncHandler(async (req, res) => {
  const { preset, start_date, end_date, search } = req.query;
  const report = await reportService.getFoodSalesReport({ preset, start_date, end_date, search });
  res.status(200).json(new ApiResponse(200, report, 'Food sales report generated successfully'));
});

/**
 * Controller: Get Combo Sales Report
 * GET /api/reports/combos
 */
const getComboSalesReport = asyncHandler(async (req, res) => {
  const { preset, start_date, end_date, search } = req.query;
  const report = await reportService.getComboSalesReport({ preset, start_date, end_date, search });
  res.status(200).json(new ApiResponse(200, report, 'Combo sales report generated successfully'));
});

/**
 * Controller: Get Payments Report
 * GET /api/reports/payments
 */
const getPaymentsReport = asyncHandler(async (req, res) => {
  const { preset, start_date, end_date, search } = req.query;
  const report = await reportService.getPaymentsReport({ preset, start_date, end_date, search });
  res.status(200).json(new ApiResponse(200, report, 'Payments report generated successfully'));
});

/**
 * Controller: Get GST Tax Report
 * GET /api/reports/tax
 */
const getTaxReport = asyncHandler(async (req, res) => {
  const { preset, start_date, end_date } = req.query;
  const report = await reportService.getTaxReport({ preset, start_date, end_date });
  res.status(200).json(new ApiResponse(200, report, 'GST tax report generated successfully'));
});

/**
 * Controller: Export Report (PDF, Excel, CSV)
 * GET /api/reports/export
 */
const exportReport = asyncHandler(async (req, res) => {
  const { type, format, preset, start_date, end_date } = req.query;
  const fileData = await reportService.exportReport({ type, format, preset, start_date, end_date });

  res.setHeader('Content-Type', fileData.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${fileData.filename}"`);
  res.status(200).send(fileData.buffer);
});

module.exports = {
  getSalesReport,
  getOrdersReport,
  getCustomersReport,
  getFoodSalesReport,
  getComboSalesReport,
  getPaymentsReport,
  getTaxReport,
  exportReport,
};
