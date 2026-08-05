const ApiError = require('../utils/apiError');

/**
 * Validate UUID format helper
 */
const isValidUuid = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof uuid === 'string' && uuidRegex.test(uuid.trim());
};

/**
 * Validate ISO date string (YYYY-MM-DD) helper
 */
const isValidDateString = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const d = new Date(dateStr);
  return d instanceof Date && !isNaN(d.getTime());
};

/**
 * Validate Create Menu Schedule Payload
 */
const validateCreateMenu = (data) => {
  const errors = {};

  if (!data.menu_date || !isValidDateString(data.menu_date)) {
    errors.menu_date = 'Valid menu_date (YYYY-MM-DD) is required.';
  }

  if (!data.food_item_id || !isValidUuid(data.food_item_id)) {
    errors.food_item_id = 'Valid food_item_id (UUID) is required.';
  }

  if (data.display_order !== undefined && data.display_order !== null && data.display_order !== '') {
    const displayOrderNum = parseInt(data.display_order, 10);
    if (isNaN(displayOrderNum) || displayOrderNum <= 0) {
      errors.display_order = 'Display order must be a positive integer greater than 0.';
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Validation Failed', errors);
  }
};

/**
 * Validate Update Menu Schedule Payload
 */
const validateUpdateMenu = (data) => {
  const errors = {};

  if (data.menu_date && !isValidDateString(data.menu_date)) {
    errors.menu_date = 'menu_date must be a valid date (YYYY-MM-DD).';
  }

  if (data.food_item_id && !isValidUuid(data.food_item_id)) {
    errors.food_item_id = 'food_item_id must be a valid UUID.';
  }

  if (data.display_order !== undefined && data.display_order !== null && data.display_order !== '') {
    const displayOrderNum = parseInt(data.display_order, 10);
    if (isNaN(displayOrderNum) || displayOrderNum <= 0) {
      errors.display_order = 'Display order must be a positive integer greater than 0.';
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Validation Failed', errors);
  }
};

module.exports = {
  validateCreateMenu,
  validateUpdateMenu,
  isValidUuid,
  isValidDateString,
};
