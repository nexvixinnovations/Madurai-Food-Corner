const ApiError = require('../utils/apiError');
const { isValidDateString } = require('./menu.validator');
const { parseFoodItems } = require('./combo.validator');

/**
 * Validate Create Special Offer Payload
 */
const validateCreateOffer = (data) => {
  const errors = {};

  const titleOrTag = data.tag_name || data.title;
  if (!titleOrTag || typeof titleOrTag !== 'string' || !titleOrTag.trim()) {
    errors.title = 'Offer tag name or title is required.';
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Validation Failed', errors);
  }
};

/**
 * Validate Update Special Offer Payload
 */
const validateUpdateOffer = (data) => {
  const errors = {};

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Validation Failed', errors);
  }
};

module.exports = {
  validateCreateOffer,
  validateUpdateOffer,
};
