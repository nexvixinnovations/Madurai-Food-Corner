const foodItemService = require('../services/foodItem.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getFoodItems = asyncHandler(async (req, res) => {
  const foodItems = await foodItemService.getAllFoodItems();
  res.status(200).json(new ApiResponse(200, foodItems, 'Food items fetched successfully'));
});

const getFoodItemById = asyncHandler(async (req, res) => {
  const foodItem = await foodItemService.getFoodItemById(req.params.id);
  res.status(200).json(new ApiResponse(200, foodItem, 'Food item details fetched successfully'));
});

const createFoodItem = asyncHandler(async (req, res) => {
  const newItem = await foodItemService.createFoodItem(req.body);
  res.status(201).json(new ApiResponse(201, newItem, 'Food item created successfully'));
});

const updateFoodItem = asyncHandler(async (req, res) => {
  const updatedItem = await foodItemService.updateFoodItem(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, updatedItem, 'Food item updated successfully'));
});

const deleteFoodItem = asyncHandler(async (req, res) => {
  await foodItemService.deleteFoodItem(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Food item deleted successfully'));
});

module.exports = {
  getFoodItems,
  getFoodItemById,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
};
