const { settingsService } = require('../services/settings.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Controller: Fetch restaurant settings
 * GET /api/settings
 */
const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getSettings();
  res.status(200).json(new ApiResponse(200, settings, 'Restaurant settings retrieved successfully'));
});

/**
 * Controller: Update restaurant settings with optional logo/banner file upload
 * PUT /api/settings
 */
const updateSettings = asyncHandler(async (req, res) => {
  const updatedSettings = await settingsService.updateSettings(req.body, req.files);
  res.status(200).json(new ApiResponse(200, updatedSettings, 'Restaurant settings updated successfully.'));
});

/**
 * Controller: Patch operational status toggles (online ordering, delivery, takeaway, dinein, maintenance mode)
 * PATCH /api/settings/status
 */
const updateSettingsStatus = asyncHandler(async (req, res) => {
  const updatedSettings = await settingsService.updateSettingsStatus(req.body);
  res.status(200).json(new ApiResponse(200, updatedSettings, 'Restaurant operational status updated successfully.'));
});

module.exports = {
  getSettings,
  updateSettings,
  updateSettingsStatus,
};
