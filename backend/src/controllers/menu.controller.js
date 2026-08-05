const menuService = require('../services/menu.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Controller: Get scheduled menu items for date (query parameter)
 * GET /api/menu?date=YYYY-MM-DD
 */
const getMenu = asyncHandler(async (req, res) => {
  const { date, search, category } = req.query;
  const menuEntries = await menuService.getMenuByDate({ date, search, category });
  res.status(200).json(new ApiResponse(200, menuEntries, 'Menu schedule retrieved successfully'));
});

/**
 * Controller: Get scheduled menu items for a specific date (route parameter)
 * GET /api/menu/:date
 */
const getMenuByDateParam = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const { search, category } = req.query;
  const menuEntries = await menuService.getMenuByDate({ date, search, category });
  res.status(200).json(new ApiResponse(200, menuEntries, 'Menu schedule retrieved successfully'));
});

/**
 * Controller: Create a new menu schedule entry
 * POST /api/menu
 */
const createMenu = asyncHandler(async (req, res) => {
  const newEntry = await menuService.createMenuSchedule(req.body);
  res.status(201).json(new ApiResponse(201, newEntry, 'Food item scheduled successfully for the menu'));
});

/**
 * Controller: Update existing menu schedule entry
 * PUT /api/menu/:id
 */
const updateMenu = asyncHandler(async (req, res) => {
  const updatedEntry = await menuService.updateMenuSchedule(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, updatedEntry, 'Menu schedule entry updated successfully'));
});

/**
 * Controller: Remove food from that day's menu schedule
 * DELETE /api/menu/:id
 */
const deleteMenu = asyncHandler(async (req, res) => {
  await menuService.deleteMenuSchedule(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Food item removed from menu schedule successfully'));
});

/**
 * Controller: Toggle availability status of a scheduled menu item
 * PATCH /api/menu/:id/status
 */
const toggleMenuStatus = asyncHandler(async (req, res) => {
  const { available } = req.body;
  const updatedEntry = await menuService.toggleMenuStatus(req.params.id, available);
  res.status(200).json(new ApiResponse(200, updatedEntry, 'Menu item availability status updated successfully'));
});

module.exports = {
  getMenu,
  getMenuByDateParam,
  createMenu,
  updateMenu,
  deleteMenu,
  toggleMenuStatus,
};
