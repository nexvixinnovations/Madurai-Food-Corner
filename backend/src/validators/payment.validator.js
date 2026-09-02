const ApiError = require('../utils/apiError');
const { isValidUuid } = require('./menu.validator');

const normalizePaymentMethod = (method) => {
  if (!method || typeof method !== 'string') return 'Online';
  const m = method.trim().toLowerCase();
  if (m.includes('cash')) return 'Cash';
  if (m.includes('upi') || m.includes('gpay') || m.includes('phonepe') || m.includes('paytm') || m.includes('bhim')) return 'UPI';
  if (m.includes('card') || m.includes('visa') || m.includes('master') || m.includes('rupay') || m.includes('credit') || m.includes('debit')) return 'Card';
  return 'Online';
};

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

  if (data.payment_method) {
    data.payment_method = normalizePaymentMethod(data.payment_method);
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
