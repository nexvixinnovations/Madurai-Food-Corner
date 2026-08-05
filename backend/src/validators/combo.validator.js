const ApiError = require('../utils/apiError');
const { isValidUuid } = require('./menu.validator');

/**
 * Helper to safely parse food_items array from JSON string or object
 */
const parseFoodItems = (inputData) => {
  if (!inputData) return [];
  const rawItems = inputData.items || inputData.combo_items || inputData.food_items || inputData;
  if (Array.isArray(rawItems)) {
    return rawItems.map(item => ({
      food_item_id: item.food_item_id || item.foodItemId || item.id,
      quantity: parseInt(item.quantity || 1, 10)
    }));
  }
  if (typeof rawItems === 'string') {
    try {
      const parsed = JSON.parse(rawItems);
      if (Array.isArray(parsed)) {
        return parsed.map(item => ({
          food_item_id: item.food_item_id || item.foodItemId || item.id,
          quantity: parseInt(item.quantity || 1, 10)
        }));
      }
    } catch (e) {
      return null;
    }
  }
  return [];
};

/**
 * Validate Create Combo Payload
 */
const validateCreateCombo = (data) => {
  const errors = {};

  // Food items array validation (minimum 2 items required for combo)
  const foodItems = parseFoodItems(data);
  if (foodItems === null || !Array.isArray(foodItems) || foodItems.length === 0) {
    errors.food_items = 'At least 2 food items must be included in the combo.';
  } else {
    const itemErrors = [];
    foodItems.forEach((item, index) => {
      if (!item.food_item_id || !isValidUuid(item.food_item_id)) {
        itemErrors.push(`Item at index ${index} must have a valid food_item_id UUID.`);
      }
      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        itemErrors.push(`Item at index ${index} must have a positive quantity.`);
      }
    });
    if (itemErrors.length > 0) {
      errors.food_items = itemErrors.join(' ');
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Validation Error', errors);
  }
};

/**
 * Validate Update Combo Payload
 */
const validateUpdateCombo = (data) => {
  const errors = {};

  if (data.food_items !== undefined || data.items !== undefined || data.combo_items !== undefined) {
    const foodItems = parseFoodItems(data);
    if (foodItems === null || (Array.isArray(foodItems) && foodItems.length === 0)) {
      errors.food_items = 'food_items must be a valid non-empty list.';
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Validation Error', errors);
  }
};

module.exports = {
  validateCreateCombo,
  validateUpdateCombo,
  parseFoodItems,
};
