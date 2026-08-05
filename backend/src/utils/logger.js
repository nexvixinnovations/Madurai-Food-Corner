/**
 * Structured Production Logger Utility
 */

const formatMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const reqId = meta.reqId ? `[ReqID: ${meta.reqId}]` : '';
  const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${reqId} ${message} ${metaStr}`.trim();
};

const logger = {
  info: (message, meta = {}) => {
    console.log(formatMessage('info', message, meta));
  },
  warn: (message, meta = {}) => {
    console.warn(formatMessage('warn', message, meta));
  },
  error: (message, meta = {}) => {
    console.error(formatMessage('error', message, meta));
  },
  http: (req, res, responseTimeMs) => {
    const meta = {
      reqId: req.id || req.headers['x-request-id'],
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTimeMs: `${responseTimeMs}ms`,
    };
    if (responseTimeMs > 1000) {
      logger.warn(`Slow Request Detected: ${req.method} ${req.originalUrl} - ${responseTimeMs}ms`, meta);
    } else {
      logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${responseTimeMs}ms`, meta);
    }
  },
};

module.exports = logger;
