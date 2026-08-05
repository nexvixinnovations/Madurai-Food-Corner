const dashboardService = require('../services/dashboard.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Controller: Fetch complete real-time dashboard and analytics data
 * GET /api/dashboard
 */
const getDashboard = asyncHandler(async (req, res) => {
  const { period, start_date, end_date } = req.query;
  const dashboardData = await dashboardService.getDashboardData({ period, start_date, end_date });
  
  res.status(200).json(new ApiResponse(200, dashboardData, 'Dashboard data loaded successfully'));
});

module.exports = {
  getDashboard,
};
