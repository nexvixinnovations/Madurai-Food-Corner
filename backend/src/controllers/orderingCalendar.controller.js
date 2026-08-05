const orderingCalendarService = require('../services/orderingCalendar.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

/**
 * Controller: GET /api/admin/ordering-calendar
 * Admin retrieves all date availability overrides from Neon DB ordering_calendar table
 */
const getAdminCalendar = asyncHandler(async (req, res) => {
  logger.info('[OrderingCalendarController] GET /api/admin/ordering-calendar requested');
  const data = await orderingCalendarService.getAdminCalendar();
  res.status(200).json(new ApiResponse(200, data, 'Ordering calendar retrieved successfully.'));
});

/**
 * Controller: PUT /api/admin/ordering-calendar
 * Admin upserts date availability settings in Neon DB ordering_calendar table
 */
const updateAdminCalendar = asyncHandler(async (req, res) => {
  logger.info('[OrderingCalendarController] PUT /api/admin/ordering-calendar requested');
  const payload = req.body || {};
  const updatedData = await orderingCalendarService.updateAdminCalendar(payload);
  res.status(200).json(new ApiResponse(200, updatedData, 'Ordering calendar updated successfully.'));
});

/**
 * Controller: GET /api/website/ordering-calendar
 * Customer public endpoint to fetch closed dates
 */
const getWebsiteCalendar = asyncHandler(async (req, res) => {
  logger.info('[OrderingCalendarController] GET /api/website/ordering-calendar requested');
  const data = await orderingCalendarService.getWebsiteClosedDates();
  res.status(200).json(new ApiResponse(200, data, 'Public ordering calendar retrieved successfully.'));
});

module.exports = {
  getAdminCalendar,
  updateAdminCalendar,
  getWebsiteCalendar,
};
