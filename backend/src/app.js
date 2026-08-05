const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const envConfig = require('./config/env.config');
const { requestIdMiddleware, responseTimeMiddleware, standardRateLimiter } = require('./middleware/security.middleware');
const foodRoutes = require('./routes/food.routes');
const menuRoutes = require('./routes/menu.routes');
const comboRoutes = require('./routes/combo.routes');
const offerRoutes = require('./routes/offer.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const reportRoutes = require('./routes/report.routes');
const settingsRoutes = require('./routes/settings.routes');
const notificationRoutes = require('./routes/notification.routes');
const mediaRoutes = require('./routes/media.routes');
const websiteRoutes = require('./routes/website.routes');
const adminRoutes = require('./routes/admin.routes');
const healthRoutes = require('./routes/health.routes');
const setupSwagger = require('./config/swagger.config');
const errorHandler = require('./middleware/error.middleware');
const ApiError = require('./utils/apiError');

const app = express();

// Hide Express fingerprint header
app.disable('x-powered-by');

// Request ID & Performance Tracing Middleware
app.use(requestIdMiddleware);
app.use(responseTimeMiddleware);

// Security Headers via Helmet
app.use(helmet());

// Gzip Response Compression
app.use(compression());

// Rate Limiting
app.use(standardRateLimiter);

// Enable CORS
app.use(cors({
  origin: envConfig.CORS_ORIGIN === '*' ? true : envConfig.CORS_ORIGIN,
  credentials: true,
}));

// Body Parsers with payload limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve Static Files
app.use('/public', express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Setup Swagger API Documentation UI (/api/docs and /docs)
setupSwagger(app);

// Root Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Madurai Food Corner ERP Backend Running',
    documentation: '/api/docs',
    health: '/api/health',
  });
});

// System Health Check Endpoint
app.use('/api/health', healthRoutes);

// Register Integration Layer Base Routes
app.use('/api/website', websiteRoutes);
app.use('/api/admin', adminRoutes);

// Register Feature Core Base Routes
app.use('/api/foods', foodRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/combos', comboRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/media', mediaRoutes);

// Handle 404 Route Errors
app.use((req, res, next) => {
  next(new ApiError(404, `Cannot ${req.method} ${req.originalUrl} - Endpoint not found`));
});

// Global Error Handler Middleware
app.use(errorHandler);

module.exports = app;
