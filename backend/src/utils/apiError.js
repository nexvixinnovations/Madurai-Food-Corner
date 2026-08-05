/**
 * Custom Error Class for standardizing Failure responses
 */
class ApiError extends Error {
  constructor(statusCode, message = 'An error occurred', errorDetails = null) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.message = message;
    this.error = errorDetails || {};
  }
}

module.exports = ApiError;
