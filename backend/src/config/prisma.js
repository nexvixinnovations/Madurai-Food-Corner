const { PrismaClient } = require('@prisma/client');

/**
 * Singleton PrismaClient Instance
 * Connects to Neon PostgreSQL DB via DATABASE_URL environment variable.
 */
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

module.exports = prisma;
