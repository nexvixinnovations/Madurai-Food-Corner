require('dotenv').config();
const app = require('./app');
const envConfig = require('./config/env.config');
const logger = require('./utils/logger');
const prisma = require('./config/prisma');

const PORT = envConfig.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Madurai Food Corner ERP Backend running in ${envConfig.NODE_ENV} mode on PORT: ${PORT}`);
  console.log(`[DEBUG] CASHFREE_APP_ID present: ${!!process.env.CASHFREE_APP_ID}`);
  console.log(`[DEBUG] CASHFREE_SECRET_KEY present: ${!!process.env.CASHFREE_SECRET_KEY}`);
  console.log(`[DEBUG] CASHFREE_ENV value: ${process.env.CASHFREE_ENV}`);
  console.log(`[DEBUG] CASHFREE_API_VERSION value: ${process.env.CASHFREE_API_VERSION}`);
  logger.info(`📡 Server Base URL: http://0.0.0.0:${PORT}/`);
  logger.info(`📖 Swagger API Docs: http://localhost:${PORT}/api/docs`);
  logger.info(`❤️ Health Check: http://localhost:${PORT}/api/health`);
});

// Graceful Shutdown Handler
const gracefulShutdown = (signal) => {
  logger.warn(`Received ${signal}. Shutting down server gracefully...`);

  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await prisma.$disconnect();
      logger.info('Prisma database connection disconnected.');
    } catch (err) {
      logger.error('Error disconnecting database:', { error: err.message });
    }
    process.exit(0);
  });

  // Force close after 10s if connections aren't closed
  setTimeout(() => {
    logger.error('Could not close connections in time, forcing shutdown.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle Unhandled Promise Rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down process...', { error: err.message, stack: err.stack });
  server.close(() => {
    process.exit(1);
  });
});

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down process...', { error: err.message, stack: err.stack });
  process.exit(1);
});
