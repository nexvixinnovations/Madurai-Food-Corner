const comboService = require('../services/combo.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Controller: Get all combos with search, available, offer_enabled filters
 * GET /api/combos
 */
const getCombos = asyncHandler(async (req, res) => {
  const { search, available, offer_enabled } = req.query;
  const combos = await comboService.getAllCombos({ search, available, offer_enabled });
  res.status(200).json(new ApiResponse(200, combos, 'Combos retrieved successfully'));
});

/**
 * Controller: Get single combo by ID with nested food items
 * GET /api/combos/:id
 */
const getComboById = asyncHandler(async (req, res) => {
  const combo = await comboService.getComboById(req.params.id);
  res.status(200).json(new ApiResponse(200, combo, 'Combo details retrieved successfully'));
});

/**
 * Controller: Create new combo meal with image upload and linked food items
 * POST /api/combos
 */
const createCombo = asyncHandler(async (req, res) => {
  const newCombo = await comboService.createCombo(req.body, req.file);
  res.status(201).json(new ApiResponse(201, newCombo, 'Combo created successfully'));
});

/**
 * Controller: Update existing combo meal with optional image update and item updates
 * PUT /api/combos/:id
 */
const updateCombo = asyncHandler(async (req, res) => {
  const updatedCombo = await comboService.updateCombo(req.params.id, req.body, req.file);
  res.status(200).json(new ApiResponse(200, updatedCombo, 'Combo updated successfully'));
});

/**
 * Controller: Delete combo meal and remove image from Cloudinary
 * DELETE /api/combos/:id
 */
const deleteCombo = asyncHandler(async (req, res) => {
  await comboService.deleteCombo(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Combo deleted successfully'));
});

/**
 * Controller: Toggle availability status of a combo
 * PATCH /api/combos/:id/status
 */
const toggleComboStatus = asyncHandler(async (req, res) => {
  const { available } = req.body;
  const updatedCombo = await comboService.toggleComboStatus(req.params.id, available);
  res.status(200).json(new ApiResponse(200, updatedCombo, 'Combo availability status updated successfully'));
});

module.exports = {
  getCombos,
  getComboById,
  createCombo,
  updateCombo,
  deleteCombo,
  toggleComboStatus,
};
