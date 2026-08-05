# Madurai Food Corner ERP - Backend API

Production-ready Node.js REST API using Express.js and Prisma ORM backed by Neon PostgreSQL.

## Architecture Pattern

```text
Controller  -> Handles HTTP Request/Response
    ↓
 Service     -> Executes Business Logic & Validations
    ↓
Repository  -> Performs Prisma Database Queries
    ↓
 Database   -> Neon PostgreSQL
```

## Setup Instructions

1. Copy `.env.example` to `.env` and fill in credential values:
   ```bash
   cp .env.example .env
   ```
2. Install npm modules:
   ```bash
   npm install
   ```
3. Generate Prisma client & sync schema:
   ```bash
   npx prisma db push
   ```
4. Run in dev mode:
   ```bash
   npm run dev
   ```
