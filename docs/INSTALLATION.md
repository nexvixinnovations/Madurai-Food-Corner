# Installation & Environment Setup Guide

This guide details the step-by-step procedure to configure and launch all services within **Madurai Food Corner ERP**.

---

## 📋 Prerequisites

Before starting, ensure you have installed:
- **Node.js**: v18.x or v20.x LTS
- **npm**: v9.x or higher
- **Android Studio**: Hedgehog (2023.1.1) or newer with Kotlin 1.9+ & Jetpack Compose compiler
- **Git**: v2.x
- **PostgreSQL Database**: Neon Serverless PostgreSQL instance

---

## 🛠️ Step 1: Database Setup (Neon PostgreSQL)

1. Sign up/Log in to [Neon Tech](https://neon.tech/).
2. Create a project named `madurai-food-corner-db`.
3. Obtain your direct connection string (PostgreSQL URI).
4. Example URI format: `postgresql://user:password@ep-cool-host.us-east-2.aws.neon.tech/neondb?sslmode=require`

---

## ⚙️ Step 2: Backend Configuration & Launch

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment configuration template:
   ```bash
   cp .env.example .env
   ```
4. Update `.env` with your Neon PostgreSQL URL and secrets:
   ```env
   PORT=5000
   DATABASE_URL="postgresql://user:password@ep-cool-host.us-east-2.aws.neon.tech/neondb?sslmode=require"
   JWT_SECRET="your_secure_jwt_secret_key"
   CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
   CLOUDINARY_API_KEY="your_cloudinary_api_key"
   CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
   RAZORPAY_KEY_ID="your_razorpay_key_id"
   RAZORPAY_SECRET="your_razorpay_secret"
   ```
5. Synchronize Prisma Schema with Database:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
6. Start the Backend server in development mode:
   ```bash
   npm run dev
   ```
   The API server will listen on `http://localhost:5000/api/v1/`.

---

## 🌐 Step 3: Customer Web App Configuration & Launch

1. Open a new terminal and navigate to `website`:
   ```bash
   cd website
   ```
2. Install frontend packages:
   ```bash
   npm install
   ```
3. Launch Vite development server:
   ```bash
   npm run dev
   ```
4. Access the web app in your browser at `http://localhost:5173`.

---

## 📱 Step 4: Admin Android App Launch

1. Launch **Android Studio**.
2. Select **Open** and select the `admin-app/` directory from the workspace.
3. Allow Gradle sync to download all required dependencies (`Jetpack Compose`, `Retrofit`, `Coil`, etc.).
4. Verify base URL configuration in `com.maduraifoodcorner.admin.data.network.RetrofitInstance` points to your backend IP or `http://10.201.50.49:5000/api/v1/` for Android Emulator.
5. Select a Target Emulator / Physical Device and press **Run 'app'** (`Shift + F10`).

---

## 🧪 Verification Commands

| Component | Check Command / URL |
| :--- | :--- |
| **Backend Health** | `curl http://localhost:5000/api/v1/health` |
| **Prisma Studio** | `npx prisma studio` (inside `backend/`) |
| **Website** | Open `http://localhost:5173` |
| **Admin App** | App builds & displays Bottom Navigation with placeholder screens |
