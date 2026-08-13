require('dotenv').config();

/**
 * Environment Variables Configuration & Validation
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

const validateEnv = () => {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`[WARNING] Missing environment variables: ${missing.join(', ')}. Some services may operate in fallback mode.`);
  }
};

validateEnv();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: process.env.DATABASE_URL,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  MAX_NOTIFICATION_RETRIES: parseInt(process.env.MAX_NOTIFICATION_RETRIES || '3', 10),
  CASHFREE_APP_ID: process.env.CASHFREE_APP_ID || '',
  CASHFREE_SECRET_KEY: process.env.CASHFREE_SECRET_KEY || '',
  CASHFREE_ENV: process.env.CASHFREE_ENV || 'SANDBOX',
  CASHFREE_API_VERSION: process.env.CASHFREE_API_VERSION || '2023-08-01',
};
