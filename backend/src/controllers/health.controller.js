const prisma = require('../config/prisma');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Controller: Deep Health Check & System Status
 * GET /api/health
 */
const getHealthStatus = asyncHandler(async (req, res) => {
  let dbStatus = 'healthy';
  let dbLatencyMs = 0;

  const startDb = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - startDb;
  } catch (err) {
    dbStatus = 'unhealthy';
  }

  const memoryUsage = process.memoryUsage();
  const memoryFormatted = {
    rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
  };

  const statusData = {
    serverStatus: dbStatus === 'healthy' ? 'OK' : 'DEGRADED',
    database: {
      status: dbStatus,
      latencyMs: `${dbLatencyMs}ms`,
    },
    memoryUsage: memoryFormatted,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    uptime: `${Math.floor(process.uptime())} seconds`,
    timestamp: new Date().toISOString(),
  };

  const statusCode = dbStatus === 'healthy' ? 200 : 503;
  res.status(statusCode).json(new ApiResponse(statusCode, statusData, 'System health check executed'));
});

module.exports = {
  getHealthStatus,
};
