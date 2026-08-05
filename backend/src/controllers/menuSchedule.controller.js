const menuScheduleService = require('../services/menuSchedule.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getMenuSchedules = asyncHandler(async (req, res) => {
  const schedules = await menuScheduleService.getMenuSchedules();
  res.status(200).json(new ApiResponse(200, schedules, 'Menu schedules fetched successfully'));
});

const createMenuSchedule = asyncHandler(async (req, res) => {
  const newSchedule = await menuScheduleService.createMenuSchedule(req.body);
  res.status(201).json(new ApiResponse(201, newSchedule, 'Menu schedule created successfully'));
});

const deleteMenuSchedule = asyncHandler(async (req, res) => {
  await menuScheduleService.deleteMenuSchedule(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Menu schedule deleted successfully'));
});

module.exports = {
  getMenuSchedules,
  createMenuSchedule,
  deleteMenuSchedule,
};
