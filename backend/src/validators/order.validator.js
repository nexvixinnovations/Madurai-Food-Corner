const ApiError = require('../utils/apiError');
const { isValidUuid, isValidDateString } = require('./menu.validator');

/**
 * Validate Create Order Payload
 */
const validateCreateOrder = (data) => {
  const errors = {};

  // Customer info validation
  if (!data.customer || typeof data.customer !== 'object') {
    errors.customer = 'Customer details object is required.';
  } else {
    if (!data.customer.name || typeof data.customer.name !== 'string' || !data.customer.name.trim()) {
      errors['customer.name'] = 'Customer name is required.';
    }
    if (!data.customer.phone || typeof data.customer.phone !== 'string' || !data.customer.phone.trim()) {
      errors['customer.phone'] = 'Customer phone number is required.';
    }
  }

  // Order details validation
  if (!data.required_date || !isValidDateString(data.required_date)) {
    errors.required_date = 'Valid required_date (YYYY-MM-DD) is required.';
  }

  if (!data.order_type || typeof data.order_type !== 'string' || !data.order_type.trim()) {
    errors.order_type = 'order_type is required (e.g. Parcel, Dine-In, Take Away, Delivery).';
  }

  // Items array validation
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.items = 'Order must contain at least one item.';
  } else {
    const itemErrors = [];
    data.items.forEach((item, index) => {
      if (!item.type || !['food', 'combo'].includes(item.type.toLowerCase())) {
        itemErrors.push(`Item at index ${index} must have type 'food' or 'combo'.`);
      }
      if (!item.id || !isValidUuid(item.id)) {
        itemErrors.push(`Item at index ${index} must have a valid item id UUID.`);
      }
      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        itemErrors.push(`Item at index ${index} must have a quantity greater than 0.`);
      }
    });

    if (itemErrors.length > 0) {
      errors.items = itemErrors;
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Validation Failed', errors);
  }
};

/**
 * Validate Update Order Status Payload
 */
const validateUpdateOrderStatus = (status) => {
  const allowedStatuses = ['Pending', 'Accepted', 'Preparing', 'Ready', 'Completed', 'Cancelled'];
  if (!status || typeof status !== 'string' || !allowedStatuses.includes(status.trim())) {
    throw new ApiError(400, `Invalid order status. Allowed statuses: ${allowedStatuses.join(', ')}.`);
  }
};

module.exports = {
  validateCreateOrder,
  validateUpdateOrderStatus,
};
