const express = require('express');
const router = express.Router();
const foodController = require('../controllers/food.controller');
const upload = require('../middleware/upload.middleware');

/**
 * Routes for /api/foods
 */

// GET all food items (supports search, category, food_type, available, sort)
router.get('/', foodController.getFoods);

// GET single food item by ID
router.get('/:id', foodController.getFoodById);

// POST create new food item with optional 'image' file upload
router.post('/', upload.single('image'), foodController.createFood);

// PUT update food item with optional new 'image' file upload
router.put('/:id', upload.single('image'), foodController.updateFood);

// DELETE food item and clean up Cloudinary asset
router.delete('/:id', foodController.deleteFood);

// PATCH toggle or set availability status
router.patch('/:id/status', foodController.toggleFoodStatus);

module.exports = router;
