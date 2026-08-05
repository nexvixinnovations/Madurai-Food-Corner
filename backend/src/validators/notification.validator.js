const ApiError = require('../utils/apiError');

/**
 * Validate Manual Notification Send Payload
 */
const validateSendNotification = (data) => {
  const errors = {};

  const allowedChannels = ['email', 'whatsapp', 'sms', 'push', 'in_app'];
  if (!data.channel || typeof data.channel !== 'string' || !allowedChannels.includes(data.channel.toLowerCase().trim())) {
    errors.channel = `Channel is required and must be one of: ${allowedChannels.join(', ')}.`;
  }

  if (!data.recipient || typeof data.recipient !== 'string' || !data.recipient.trim()) {
    errors.recipient = 'Recipient address/phone/token is required.';
  }

  if (!data.template) {
    if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
      errors.title = 'Title or template name is required.';
    }
    if (!data.message || typeof data.message !== 'string' || !data.message.trim()) {
      errors.message = 'Message body or template name is required.';
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'Validation Failed', errors);
  }
};

module.exports = {
  validateSendNotification,
};
