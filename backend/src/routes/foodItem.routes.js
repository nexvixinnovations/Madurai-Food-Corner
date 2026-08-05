const express = require('express');
const router = express.Router();
const foodItemController = require('../controllers/foodItem.controller');

router.get('/', foodItemController.getFoodItems);
router.get('/:id', foodItemController.getFoodItemById);
router.post('/', foodItemController.createFoodItem);
router.put('/:id', foodItemController.updateFoodItem);
router.delete('/:id', foodItemController.deleteFoodItem);

module.exports = router;
