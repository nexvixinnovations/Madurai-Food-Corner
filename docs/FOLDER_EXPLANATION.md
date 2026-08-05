# Folder Architecture & Layout Guide

This document describes the design principles and internal folder layout for the **Madurai Food Corner ERP** monorepo workspace.

---

## 📁 Monorepo Overview

```text
MaduraiFoodCornerERP/
├── backend/            # Express.js REST API Clean Architecture
├── database/           # Master Prisma schemas & DB migration docs
├── admin-app/          # Android Native Jetpack Compose Admin Application
├── website/            # Customer React + Vite Web Application
├── docs/               # Technical & Architecture Specifications
└── README.md           # Master Documentation
```

---

## 🛠️ 1. Backend (`/backend`) Clean Architecture

The backend strictly separates concerns using a 4-tier layer pattern:
`Controller → Service → Repository → Database`

```text
backend/
├── src/
│   ├── config/          # Environment variables loader & SDK initializations (Cloudinary, Razorpay, DB)
│   ├── controllers/     # Express route handlers (Extract HTTP request params/body & return HTTP responses)
│   ├── services/        # Core Business Logic processing layer
│   ├── repository/     # Abstract Prisma database query layer
│   ├── routes/          # API route definitions versioned under /api/v1/
│   ├── middleware/      # Auth (JWT verification), Validation, Upload (Multer), Global Error Handling
│   ├── utils/           # Standardized ApiError, ApiResponse, and asyncHandler utilities
│   ├── validators/      # Schema request body validation schemas
│   ├── prisma/          # Prisma client instantiation & schema definitions
│   ├── public/          # Static file serving assets
│   ├── uploads/         # Local temporary file uploads directory
│   ├── app.js           # Express app initialization, middlewares & route mounting
│   └── server.js        # HTTP server listener & graceful shutdown handlers
├── .env.example         # Template for environment variables
├── .eslintrc.json       # Code quality rules
├── .prettierrc          # Formatting rules
├── package.json         # Backend node dependencies
└── README.md            # Backend component documentation
```

### Layer Responsibilities
1. **Controllers (`src/controllers/`)**: Reads request context, calls services, sends HTTP status codes and responses. No database or heavy business logic directly inside controllers.
2. **Services (`src/services/`)**: Implements business workflow rules (e.g. calculation of discount, validating status transitions). Calls repository functions for DB access.
3. **Repository (`src/repository/`)**: Performs raw Prisma ORM queries. Provides clean data access functions.
4. **Database (`src/prisma/`)**: Schema configuration and Prisma Client generation.

---

## 🗄️ 2. Database (`/database`)

Contains the master database specification and backup Prisma schema for reference:
- `database/prisma/schema.prisma`: Universal database schema definition.
- `database/README.md`: Migration and schema evolution guidelines.

---

## 📱 3. Admin App (`/admin-app`) Architecture

Built using native Kotlin Android with Google's Jetpack Compose and MVVM architecture.

```text
admin-app/
├── build.gradle.kts     # Top-level Gradle script
├── settings.gradle.kts  # Module inclusions & repositories
├── app/
│   ├── build.gradle.kts # App module dependencies (Compose, Retrofit, Coil, Navigation)
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml
│           └── java/com/maduraifoodcorner/admin/
│               ├── MainActivity.kt         # Single Activity hosting NavigationHost
│               ├── AdminApp.kt             # Application class initialization
│               ├── data/
│               │   ├── models/            # Data transfer models (Order, FoodItem, User, etc.)
│               │   └── network/           # Retrofit interface definitions & HTTP Client
│               ├── repository/            # Admin application data repository
│               ├── ui/
│               │   ├── components/        # Reusable Compose UI elements (Header, Cards, Buttons)
│               │   ├── navigation/        # Screen routing graph & bottom nav navigation
│               │   ├── screens/           # Modular Compose screen views (Login, Dashboard, Orders, etc.)
│               │   └── viewmodels/        # Screen state management ViewModels
│               └── utils/                 # Extension helpers & UI state wrappers
└── README.md
```

---

## 🌐 4. Customer Website (`/website`) Architecture

Built with React 18, Vite, TypeScript, and TailwindCSS.

```text
website/
├── src/
│   ├── assets/          # Static branding images & icons
│   ├── components/      # Reusable React components (Navbar, Footer, ItemCard, LoadingSpinner)
│   ├── context/         # React Context stores (AuthContext, CartContext)
│   ├── hooks/           # Custom React hooks (useAuth, useCart, useFetch)
│   ├── layouts/         # Page shell layouts (MainLayout, AuthLayout)
│   ├── pages/           # Page view components (Home, Menu, Offers, Cart, TrackOrder, etc.)
│   ├── services/        # Axios API client services (authService, orderService, menuService)
│   ├── types/           # TypeScript interface & type definitions
│   ├── utils/           # Helper functions (currency formatter, date formatter)
│   ├── App.tsx          # Master App router configuration
│   ├── main.tsx         # React root entry DOM render
│   ├── index.css        # Tailwind directives & global CSS rules
│   └── vite-env.d.ts    # Vite environment type declarations
├── index.html           # HTML template
├── package.json         # Web node dependencies
├── vite.config.ts       # Vite bundler configuration
├── tsconfig.json        # TypeScript compiler rules
├── tailwind.config.js   # Tailwind theme & design tokens
├── postcss.config.js    # CSS processing setup
└── README.md            # Website component documentation
```

---

## 📑 5. Documentation (`/docs`)

- `docs/INSTALLATION.md`: Setup instructions for all applications.
- `docs/FOLDER_EXPLANATION.md`: This file.
- `docs/DEVELOPMENT_WORKFLOW.md`: Git branching, linting, formatting, PR standards.
- `docs/API_DOCS.md`: Exhaustive API endpoint definitions.
