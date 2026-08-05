const ApiError = require('../utils/apiError');
const { isValidDateString } = require('./menu.validator');

/**
 * Validate Date Range Query Parameters
 */
const validateDateRange = (startDate, endDate) => {
  const errors = {};

  let startDateObj = null;
  let endDateObj = null;

  if (startDate) {
    if (!isValidDateString(startDate)) {
      errors.start_date = 'start_date must be a valid date format (YYYY-MM-DD).';
    } else {
      startDateObj = new Date(startDate);
    }
  }

  if (endDate) {
    if (!isValidDateString(endDate)) {
      errors.end_date = 'end_date must be a valid date format (YYYY-MM-DD).';
    } else {
      endDateObj = new Date(endDate);
    }
  }

  if (startDateObj && endDateObj && endDateObj < startDateObj) {
    errors.end_date = 'end_date must not be earlier than start_date.';
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Validation Failed', errors);
  }
};

/**
 * Validate Report Export Query Parameters
 */
const validateExportParams = ({ type, format, start_date, end_date }) => {
  const errors = {};

  const allowedTypes = ['sales', 'orders', 'customers', 'foods', 'combos', 'payments', 'tax'];
  if (!type || !allowedTypes.includes(type.toLowerCase())) {
    errors.type = `Export report type is required and must be one of: ${allowedTypes.join(', ')}.`;
  }

  const allowedFormats = ['pdf', 'excel', 'csv'];
  if (!format || !allowedFormats.includes(format.toLowerCase())) {
    errors.format = `Export format is required and must be one of: ${allowedFormats.join(', ')}.`;
  }

  validateDateRange(start_date, end_date);

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Validation Failed', errors);
  }
};

module.exports = {
  validateDateRange,
  validateExportParams,
};
