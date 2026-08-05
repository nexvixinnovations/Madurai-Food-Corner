# Madurai Food Corner ERP

A multi-app Enterprise Resource Planning system for **Madurai Food Corner**, comprising a Node.js/Express clean architecture backend, a React/TypeScript customer ordering website, and a Kotlin/Jetpack Compose admin mobile app.

---

## 🏗️ Repository Structure

```text
MaduraiFoodCornerERP/
├── backend/            # Express.js REST API (Node.js + Prisma + Neon PostgreSQL)
├── admin-app/          # Android Native Admin Application (Kotlin + Jetpack Compose + MVVM)
├── website/            # Customer Web Application (React + Vite + TypeScript + TailwindCSS)
├── database/           # Database Schema, Prisma migrations & ER Diagrams
├── docs/               # Architecture, API specifications, and installation documentation
└── README.md           # Master Workspace Documentation
```

---

## ⚡ Quick Start & Setup

Refer to the complete setup instructions in the [Installation Guide](file:///d:/Projects/Madurai%20Food%20Corner%20ERP/docs/INSTALLATION.md).

### 1. Backend API
```bash
cd backend
npm install
cp .env.example .env
npx prisma db push
npm run dev
```

### 2. Customer Website
```bash
cd website
npm install
npm run dev
```

### 3. Admin Mobile App
Open `admin-app/` directory in **Android Studio (Hedgehog or newer)**, let Gradle sync, and run on an emulator or Android device.

---

## 📚 Documentation Links
- 📘 [Installation & Setup Guide](file:///d:/Projects/Madurai%20Food%20Corner%20ERP/docs/INSTALLATION.md)
- 📐 [Architecture & Folder Breakdown](file:///d:/Projects/Madurai%20Food%20Corner%20ERP/docs/FOLDER_EXPLANATION.md)
- 🔌 [API Endpoints Documentation](file:///d:/Projects/Madurai%20Food%20Corner%20ERP/docs/API_DOCS.md)
- 🛠️ [Development Workflow & Coding Standards](file:///d:/Projects/Madurai%20Food%20Corner%20ERP/docs/DEVELOPMENT_WORKFLOW.md)

---

## 🛡️ Key Technologies
- **Backend:** Node.js, Express.js, Prisma ORM, Neon PostgreSQL, JWT, Multer, Cloudinary, Razorpay
- **Customer Web:** React 18, Vite, TypeScript, TailwindCSS, React Router v6, Axios
- **Admin App:** Android SDK, Kotlin, Jetpack Compose, Retrofit, Material 3, Navigation Compose, MVVM
