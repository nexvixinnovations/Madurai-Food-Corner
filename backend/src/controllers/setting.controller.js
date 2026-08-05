const settingService = require('../services/setting.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingService.getSettings();
  res.status(200).json(new ApiResponse(200, settings, 'Settings fetched successfully'));
});

const updateSettings = asyncHandler(async (req, res) => {
  const updatedSettings = await settingService.updateSettings(req.body.id, req.body);
  res.status(200).json(new ApiResponse(200, updatedSettings, 'Settings updated successfully'));
});

module.exports = {
  getSettings,
  updateSettings,
};
