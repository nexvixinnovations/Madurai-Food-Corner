const ApiError = require('../utils/apiError');
const { isValidUuid } = require('./menu.validator');

/**
 * Validate Create Payment Payload
 */
const validateCreatePayment = (data) => {
  const errors = {};

  if (!data.order_id || !isValidUuid(data.order_id)) {
    errors.order_id = 'Valid order_id (UUID) is required.';
  }

  const amountNum = parseFloat(data.amount);
  if (data.amount === undefined || data.amount === null || isNaN(amountNum) || amountNum <= 0) {
    errors.amount = 'Amount is required and must be greater than 0.';
  }

  const allowedMethods = ['Cash', 'UPI', 'Card', 'Online'];
  if (data.payment_method) {
    const methodStr = data.payment_method.trim();
    if (!allowedMethods.some((m) => m.toLowerCase() === methodStr.toLowerCase())) {
      errors.payment_method = `Allowed payment methods: ${allowedMethods.join(', ')}.`;
    } else {
      // If method is UPI, Card, or Online, transaction_id is required
      if (['upi', 'card', 'online'].includes(methodStr.toLowerCase())) {
        if (!data.transaction_id || typeof data.transaction_id !== 'string' || !data.transaction_id.trim()) {
          errors.transaction_id = `Transaction ID is required for ${methodStr} payment method.`;
        }
      }
    }
  }

  const allowedStatuses = ['Pending', 'Paid', 'Failed', 'Refunded', 'Cancelled'];
  if (data.status) {
    const statusStr = data.status.trim();
    if (!allowedStatuses.some((s) => s.toLowerCase() === statusStr.toLowerCase())) {
      errors.status = `Allowed payment statuses: ${allowedStatuses.join(', ')}.`;
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Validation Failed', errors);
  }
};

/**
 * Validate Update Payment Status Payload
 */
const validateUpdatePaymentStatus = (status) => {
  const allowedStatuses = ['Pending', 'Paid', 'Failed', 'Refunded', 'Cancelled'];
  if (!status || typeof status !== 'string' || !allowedStatuses.some((s) => s.toLowerCase() === status.trim().toLowerCase())) {
    throw new ApiError(400, `Invalid payment status. Allowed statuses: ${allowedStatuses.join(', ')}.`);
  }
};

module.exports = {
  validateCreatePayment,
  validateUpdatePaymentStatus,
};
