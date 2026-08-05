const crypto = require('crypto');
const logger = require('../utils/logger');
const ApiError = require('../utils/apiError');

/**
 * Request ID Middleware: Generates or propagates unique x-request-id for every HTTP request
 */
const requestIdMiddleware = (req, res, next) => {
  const reqId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = reqId;
  res.setHeader('x-request-id', reqId);
  next();
};

/**
 * Response Time Tracking Middleware
 */
const responseTimeMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(req, res, duration);
  });

  next();
};

/**
 * In-Memory Simple Rate Limiter Middleware
 */
const createRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests. Please try again later.' }) => {
  const requests = new Map();

  // Periodic cleanup
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of requests.entries()) {
      if (now - data.startTime > windowMs) {
        requests.delete(ip);
      }
    }
  }, windowMs);

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();

    if (!requests.has(ip)) {
      requests.set(ip, { count: 1, startTime: now });
      return next();
    }

    const data = requests.get(ip);
    if (now - data.startTime > windowMs) {
      data.count = 1;
      data.startTime = now;
      return next();
    }

    data.count += 1;
    if (data.count > max) {
      return next(new ApiError(429, message));
    }

    next();
  };
};

const standardRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300, // 300 requests per 15 minutes
});

const sensitiveRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 requests per 15 minutes
});

module.exports = {
  requestIdMiddleware,
  responseTimeMiddleware,
  standardRateLimiter,
  sensitiveRateLimiter,
};
