const foodService = require('../services/food.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Controller: Get all food items with optional filters/search/sort
 * GET /api/foods
 */
const getFoods = asyncHandler(async (req, res) => {
  const { search, category, food_type, available, sort } = req.query;
  const foods = await foodService.getAllFoods({ search, category, food_type, available, sort });
  res.status(200).json(new ApiResponse(200, foods, 'Food items retrieved successfully'));
});

/**
 * Controller: Get single food item by ID
 * GET /api/foods/:id
 */
const getFoodById = asyncHandler(async (req, res) => {
  const food = await foodService.getFoodById(req.params.id);
  res.status(200).json(new ApiResponse(200, food, 'Food item details retrieved successfully'));
});

/**
 * Controller: Create new food item with image upload
 * POST /api/foods
 */
const createFood = asyncHandler(async (req, res) => {
  const newFood = await foodService.createFood(req.body, req.file);
  res.status(201).json(new ApiResponse(201, newFood, 'Food item created successfully'));
});

/**
 * Controller: Update existing food item with optional new image
 * PUT /api/foods/:id
 */
const updateFood = asyncHandler(async (req, res) => {
  const updatedFood = await foodService.updateFood(req.params.id, req.body, req.file);
  res.status(200).json(new ApiResponse(200, updatedFood, 'Food item updated successfully'));
});

/**
 * Controller: Delete food item and remove image from Cloudinary
 * DELETE /api/foods/:id
 */
const deleteFood = asyncHandler(async (req, res) => {
  await foodService.deleteFood(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Food item deleted successfully'));
});

/**
 * Controller: Toggle or patch availability status
 * PATCH /api/foods/:id/status
 */
const toggleFoodStatus = asyncHandler(async (req, res) => {
  const { available } = req.body;
  const updatedFood = await foodService.toggleFoodStatus(req.params.id, available);
  res.status(200).json(new ApiResponse(200, updatedFood, 'Food item availability status updated successfully'));
});

/**
 * Controller: Bulk enable or disable all food items and combos
 * PUT /api/foods/bulk-availability
 */
const bulkUpdateAvailability = asyncHandler(async (req, res) => {
  const { available } = req.body;
  const result = await foodService.bulkUpdateAvailability(available);
  res.status(200).json(new ApiResponse(200, result, 'Bulk availability updated successfully'));
});

module.exports = {
  getFoods,
  getFoodById,
  createFood,
  updateFood,
  deleteFood,
  toggleFoodStatus,
  bulkUpdateAvailability,
};
