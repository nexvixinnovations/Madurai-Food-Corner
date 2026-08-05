const ApiError = require('../utils/apiError');

/**
 * Validate Food Item Creation payload
 */
const validateCreateFood = (data) => {
  const errors = {};

  // Required Fields
  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.name = 'Food item name is required.';
  }

  if (!data.category || typeof data.category !== 'string' || !data.category.trim()) {
    errors.category = 'Category is required.';
  }

  if (!data.food_type || typeof data.food_type !== 'string' || !data.food_type.trim()) {
    // Default food_type if missing
    data.food_type = 'Veg';
  } else {
    const allowedTypes = ['Veg', 'Non-Veg', 'Non Veg', 'Egg', 'Egg Items'];
    if (!allowedTypes.includes(data.food_type.trim())) {
      errors.food_type = `Food type must be one of: ${allowedTypes.join(', ')}.`;
    }
  }

  // Price validation
  const priceNum = parseFloat(data.price);
  if (data.price === undefined || data.price === null || data.price === '' || isNaN(priceNum) || priceNum <= 0) {
    errors.price = 'Price is required and must be greater than 0.';
  }

  // Offer price validation (only enforced when offer_enabled is true)
  const offerEnabled = data.offer_enabled === 'true' || data.offer_enabled === true;
  if (offerEnabled && data.offer_price !== undefined && data.offer_price !== null && data.offer_price !== '') {
    const offerPriceNum = parseFloat(data.offer_price);
    if (isNaN(offerPriceNum) || offerPriceNum < 0) {
      errors.offer_price = 'Offer price must be a valid positive number.';
    } else if (!isNaN(priceNum) && offerPriceNum > priceNum) {
      errors.offer_price = 'Offer price cannot exceed regular price.';
    }
  }

  // Display order validation
  if (data.display_order !== undefined && data.display_order !== null && data.display_order !== '') {
    const displayOrderNum = parseInt(data.display_order, 10);
    if (isNaN(displayOrderNum) || displayOrderNum <= 0) {
      errors.display_order = 'Display order must be a positive integer.';
    }
  }

  // Preparation time validation
  if (data.preparation_time !== undefined && data.preparation_time !== null && data.preparation_time !== '') {
    const prepTimeNum = parseInt(data.preparation_time, 10);
    if (isNaN(prepTimeNum) || prepTimeNum <= 0) {
      errors.preparation_time = 'Preparation time must be a positive number of minutes.';
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Validation Failed', errors);
  }
};

/**
 * Validate Food Item Update payload
 */
const validateUpdateFood = (data) => {
  const errors = {};

  if (data.food_type) {
    const allowedTypes = ['Veg', 'Non-Veg', 'Non Veg', 'Egg', 'Egg Items'];
    if (!allowedTypes.includes(data.food_type.trim())) {
      errors.food_type = `Food type must be one of: ${allowedTypes.join(', ')}.`;
    }
  }

  if (data.price !== undefined && data.price !== null) {
    const priceNum = parseFloat(data.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      errors.price = 'Price must be greater than 0.';
    }
  }

  if (data.offer_price !== undefined && data.offer_price !== null && data.offer_price !== '') {
    const offerPriceNum = parseFloat(data.offer_price);
    if (isNaN(offerPriceNum) || offerPriceNum < 0) {
      errors.offer_price = 'Offer price must be a valid positive number.';
    } else if (data.price !== undefined && offerPriceNum > parseFloat(data.price)) {
      errors.offer_price = 'Offer price cannot exceed regular price.';
    }
  }

  if (data.display_order !== undefined && data.display_order !== null && data.display_order !== '') {
    const displayOrderNum = parseInt(data.display_order, 10);
    if (isNaN(displayOrderNum) || displayOrderNum <= 0) {
      errors.display_order = 'Display order must be a positive integer.';
    }
  }

  if (data.preparation_time !== undefined && data.preparation_time !== null && data.preparation_time !== '') {
    const prepTimeNum = parseInt(data.preparation_time, 10);
    if (isNaN(prepTimeNum) || prepTimeNum <= 0) {
      errors.preparation_time = 'Preparation time must be a positive integer.';
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Validation Failed', errors);
  }
};

module.exports = {
  validateCreateFood,
  validateUpdateFood,
};
