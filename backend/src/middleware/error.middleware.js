const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || {};

  // Handle Prisma Database Constraint Errors
  if (err.code === 'P2002') {
    statusCode = 409;
    message = 'Duplicate entry conflict: A record with this unique field already exists.';
    errors = { target: err.meta?.target };
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found: The requested database entity does not exist.';
  } else if (err.code === 'P2003') {
    statusCode = 400;
    message = 'Foreign key constraint violation.';
  }

  // Handle Payload Too Large
  if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Payload Too Large: Request size exceeds server limit.';
  }

  // Log Error Details
  logger.error(message, {
    reqId: req.id,
    statusCode,
    path: req.originalUrl,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    message,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
    error: Object.keys(errors).length > 0 ? errors : { details: message },
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
