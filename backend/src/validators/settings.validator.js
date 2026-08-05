const ApiError = require('../utils/apiError');

/**
 * Regex patterns
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
const FSSAI_REGEX = /^[0-9]{14}$/;

/**
 * Validate Update Restaurant Settings Payload
 */
const validateUpdateSettings = (data) => {
  const errors = {};

  // Email validation
  if (data.email !== undefined && data.email !== null && data.email !== '') {
    if (!EMAIL_REGEX.test(data.email.trim())) {
      errors.email = 'Invalid email address format.';
    }
  }

  // Phone number validation
  if (data.phone_number !== undefined && data.phone_number !== null && data.phone_number !== '') {
    if (!PHONE_REGEX.test(data.phone_number.trim())) {
      errors.phone_number = 'Invalid phone number format.';
    }
  }

  // Alternate phone validation
  if (data.alternate_phone !== undefined && data.alternate_phone !== null && data.alternate_phone !== '') {
    if (!PHONE_REGEX.test(data.alternate_phone.trim())) {
      errors.alternate_phone = 'Invalid alternate phone number format.';
    }
  }

  // GST Number validation (optional if empty or placeholder)
  if (data.gst_number !== undefined && data.gst_number !== null && data.gst_number.trim() !== '') {
    const cleanGst = data.gst_number.trim();
    if (cleanGst.length > 0 && cleanGst.length !== 15 && !GST_REGEX.test(cleanGst)) {
      // Log warning instead of crashing settings save if legacy GST is passed
      console.warn(`[SettingsValidator] Non-standard GSTIN format: ${cleanGst}`);
    }
  }

  // FSSAI Number validation (optional if empty or placeholder)
  if (data.fssai_number !== undefined && data.fssai_number !== null && data.fssai_number.trim() !== '') {
    const cleanFssai = data.fssai_number.trim();
    if (cleanFssai.length > 0 && !FSSAI_REGEX.test(cleanFssai)) {
      console.warn(`[SettingsValidator] Non-standard FSSAI format: ${cleanFssai}`);
    }
  }

  // Tax percentage validation (0 to 100)
  if (data.tax_percentage !== undefined && data.tax_percentage !== null && data.tax_percentage !== '') {
    const taxNum = parseFloat(data.tax_percentage);
    if (isNaN(taxNum) || taxNum < 0 || taxNum > 100) {
      errors.tax_percentage = 'Tax percentage must be between 0 and 100.';
    }
  }

  // Delivery Charge validation
  if (data.delivery_charge !== undefined && data.delivery_charge !== null && data.delivery_charge !== '') {
    const chargeNum = parseFloat(data.delivery_charge);
    if (isNaN(chargeNum) || chargeNum < 0) {
      errors.delivery_charge = 'Delivery charge must be a non-negative number.';
    }
  }

  // Minimum Order Amount validation
  if (data.minimum_order_amount !== undefined && data.minimum_order_amount !== null && data.minimum_order_amount !== '') {
    const minOrderNum = parseFloat(data.minimum_order_amount);
    if (isNaN(minOrderNum) || minOrderNum < 0) {
      errors.minimum_order_amount = 'Minimum order amount must be a non-negative number.';
    }
  }

  // Free Delivery Minimum Amount validation
  if (data.free_delivery_minimum_amount !== undefined && data.free_delivery_minimum_amount !== null && data.free_delivery_minimum_amount !== '') {
    const freeDeliveryNum = parseFloat(data.free_delivery_minimum_amount);
    if (isNaN(freeDeliveryNum) || freeDeliveryNum < 0) {
      errors.free_delivery_minimum_amount = 'Free delivery minimum amount must be a non-negative number.';
    }
  }

  // Packing Charge validation
  if (data.packing_charge !== undefined && data.packing_charge !== null && data.packing_charge !== '') {
    const packingNum = parseFloat(data.packing_charge);
    if (isNaN(packingNum) || packingNum < 0) {
      errors.packing_charge = 'Packing charge must be a non-negative number.';
    }
  }

  // ─── Order Value Discount Validation ───
  // When discount is enabled, minimum amount and percentage must be valid
  if (data.order_discount_enabled === true || data.order_discount_enabled === 'true') {
    if (data.tier1_min_amount !== undefined && data.tier1_min_amount !== null && data.tier1_min_amount !== '') {
      const minAmt = parseFloat(data.tier1_min_amount);
      if (isNaN(minAmt) || minAmt <= 0) {
        errors.tier1_min_amount = 'Minimum order amount must be greater than ₹0 when discount is enabled.';
      }
    }
    if (data.tier1_percentage !== undefined && data.tier1_percentage !== null && data.tier1_percentage !== '') {
      const pct = parseFloat(data.tier1_percentage);
      if (isNaN(pct) || pct <= 0) {
        errors.tier1_percentage = 'Discount percentage must be greater than 0% when discount is enabled.';
      } else if (pct > 100) {
        errors.tier1_percentage = 'Discount percentage cannot exceed 100%.';
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Validation Failed', errors);
  }
};

module.exports = {
  validateUpdateSettings,
};
