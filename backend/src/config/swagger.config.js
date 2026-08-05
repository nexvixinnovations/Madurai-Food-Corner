const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Madurai Food Corner ERP Backend API Specification',
    version: '1.0.0',
    description: 'Production-ready REST API for Madurai Food Corner ERP serving Customer Website, Android Admin App, and Admin Web Panel.',
    contact: {
      name: 'Madurai Food Corner Development Team',
      email: 'support@maduraifoodcorner.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
    },
  ],
  tags: [
    { name: 'Customer Website', description: 'APIs for Customer Website & App' },
    { name: 'Android Admin', description: 'APIs for Android Admin App & Web Admin' },
    { name: 'Food Management', description: 'Food Catalog & Categories' },
    { name: 'Menu Scheduling', description: 'Daily Menu Schedules' },
    { name: 'Combo Management', description: 'Combo Package Meals' },
    { name: 'Special Offers', description: 'Promotions & Banner Offers' },
    { name: 'Customer Orders', description: 'Order Processing & Tracking' },
    { name: 'Payment Management', description: 'Payment Logs & Transactions' },
    { name: 'Dashboard & Analytics', description: 'Real-time Sales & Business Metrics' },
    { name: 'Reports Management', description: 'Business Reports & Export (PDF/Excel/CSV)' },
    { name: 'Restaurant Settings', description: 'Singleton Restaurant Configuration' },
    { name: 'Notification System', description: 'Multi-Channel Notifications (Email/WhatsApp/SMS/Push)' },
    { name: 'Cloudinary Media', description: 'Centralized Media & Stream Uploads' },
  ],
  paths: {
    '/api/website/menu': {
      get: {
        tags: ['Customer Website'],
        summary: "Get Today's Scheduled Menu",
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/website/combos': {
      get: {
        tags: ['Customer Website'],
        summary: 'Get Available Combos',
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/website/offers': {
      get: {
        tags: ['Customer Website'],
        summary: 'Get Active Promotional Offers',
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/website/orders': {
      post: {
        tags: ['Customer Website'],
        summary: 'Place Customer Order',
        responses: { 201: { description: 'Created' } },
      },
    },
    '/api/website/orders/track/{orderNumber}': {
      get: {
        tags: ['Customer Website'],
        summary: 'Track Order Status',
        parameters: [{ name: 'orderNumber', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/website/restaurant-info': {
      get: {
        tags: ['Customer Website'],
        summary: 'Get Restaurant Timings & Info',
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/admin/dashboard': {
      get: {
        tags: ['Android Admin'],
        summary: 'Get Real-time Admin Dashboard Metrics',
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/admin/orders': {
      get: {
        tags: ['Android Admin'],
        summary: 'Get All Customer Orders',
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/admin/foods': {
      get: {
        tags: ['Android Admin'],
        summary: 'Get Food Catalog',
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/admin/menu': {
      get: {
        tags: ['Android Admin'],
        summary: 'Get Menu Schedule',
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/admin/combos': {
      get: {
        tags: ['Android Admin'],
        summary: 'Get Combos List',
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/admin/offers': {
      get: {
        tags: ['Android Admin'],
        summary: 'Get Offers List',
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/admin/payments': {
      get: {
        tags: ['Android Admin'],
        summary: 'Get Payment Logs',
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/admin/reports': {
      get: {
        tags: ['Android Admin'],
        summary: 'Get Business Reports Summary',
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/admin/settings': {
      get: {
        tags: ['Android Admin'],
        summary: 'Get Restaurant Configuration',
        responses: { 200: { description: 'Success' } },
      },
    },
    '/api/admin/notifications': {
      get: {
        tags: ['Android Admin'],
        summary: 'Get Notification Logs',
        responses: { 200: { description: 'Success' } },
      },
    },
  },
};

const setupSwagger = (app) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};

module.exports = setupSwagger;
