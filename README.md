# 🛡️ ShieldHire: Professional Security & Bouncer Hiring Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React Native](https://img.shields.io/badge/React_Native-0.76-blue?style=for-the-badge&logo=react)](https://reactnative.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--time-010101?style=for-the-badge&logo=socket.io)](https://socket.io/)

**ShieldHire** is a comprehensive, enterprise-grade solution designed to bridge the gap between event organizers/individuals and professional security personnel (bouncers). This monorepo contains a high-performance backend, a cross-platform mobile application, and a sophisticated admin dashboard.

---

## 🏗️ Architecture Matrix

ShieldHire is built using a modern **Monorepo** architecture to ensure seamless synchronization between the client, server, and administrative tools.

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React Native (CLI), TypeScript | Cross-platform Mobile App for Users & Bouncers |
| **Backend** | Node.js, Express, Prisma, TS | High-concurrency RESTful API & WebSockets |
| **Admin Dashboard** | Next.js 15, Tailwind CSS | Management Hub for Admins |
| **Database** | PostgreSQL (via Supabase) | Persistent & Scalable Data Storage |
| **Real-time** | Socket.io | Live Location Tracking & Instant Notifications |

---

## ✨ Core Features

### 👤 For Users (Hire Security)
- **Instant Booking**: Real-time discovery and booking of vetted security personnel.
- **Interactive Maps**: View available bouncers nearby using Google Maps integration.
- **Secure Authentication**: Multi-method login via Email and Google OAuth.
- **Detailed Profiles**: Review bouncer certifications, ratings, and past performance.
- **In-App Communication**: Real-time chat with hired security (via WebSockets).

### 🛡️ For Bouncers (Security Professionals)
- **Professional Onboarding**: Comprehensive registration with identity verification.
- **Live Status Management**: Toggle availability and manage active assignments.
- **Work History**: Track earnings, completed gigs, and client feedback.
- **Real-time Alerts**: Instant push notifications for new booking requests.
- **Location Sync**: Background GPS synchronization for active duties.

### 💼 For Administrators
- **Bouncer Verification**: Verify and approve bouncer applications.
- **Platform Analytics**: Monitor active bookings, user growth, and revenue.
- **Engagement Management**: Handle disputes and monitor service quality.
- **System Config**: Manage global settings and platform parameters.

---

## 🛠️ Tech Stack Deep Dive

### **Backend (API Layer)**
- **Framework**: Express.js with TypeScript
- **ORM**: Prisma for type-safe database queries
- **Database**: PostgreSQL hosted on Supabase
- **Real-time**: Socket.io for live updates
- **Auth**: JWT (JSON Web Tokens) & Firebase Admin
- **Storage**: Vercel Blob for secure document/media handling

### **Mobile App (Frontend)**
- **Framework**: React Native 0.76 (New Architecture compatible)
- **Navigation**: React Navigation (Stack & Tabs)
- **Maps**: React Native Geolocation & Google Maps
- **State Management**: Context API & Hooks
- **Icons**: React Native Vector Icons

### **Admin Web (Dashboard)**
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS & Styled JSX
- **Components**: Custom high-fidelity administrative UI components

---

## 🚀 Getting Started

### 📦 Prerequisites
- **Node.js**: v18.x or higher
- **Package Manager**: npm/yarn
- **Development Tooling**:
  - Android Studio (for Android emulation)
  - Xcode (for iOS emulation - MacOS only)
  - Supabase CLI / Account for Database

### 📥 Installation 

Clone the repository and run the setup script:

```bash
git clone https://github.com/your-repo/ShieldHire.git
cd ShieldHire

# Install all dependencies across the monorepo
npm run install:all
```

### ⚙️ Environment Configuration

You will need to create `.env` files in each directory. Refer to the `.env.example` in each folder (if available) or use the following keys:

**Root/Backend `.env`:**
- `DATABASE_URL`: Your Supabase PostgreSQL string
- `JWT_SECRET`: Secure string for token signing
- `SUPABASE_URL` & `SUPABASE_ANON_KEY`
- `FIREBASE_PROJECT_ID` & `FIREBASE_PRIVATE_KEY`

**Frontend `.env`:**
- `API_URL`: Backend server address
- `GOOGLE_MAP_API_KEY`: For map rendering

### 🏃 Running the Application

ShieldHire uses `concurrently` to manage all services with a single command.

| Command | Action |
| :--- | :--- |
| `npm start` | Launches Backend, Metro Bundler, and Admin Dashboard |
| `npm run android` | Launches Backend, Metro, Dashboard, and boots the Android App |
| `npm run ios` | Launches Backend, Metro, Dashboard, and boots the iOS App |
| `npm run clean` | Cleans Android build caches |

---

## 📂 Project Structure

```text
ShieldHire/
├── backend/            # Express, Prisma, TypeScript
│   ├── prisma/         # Database Schema & Migrations
│   └── src/            # API Controllers, Routes, Middleware
├── frontend/           # React Native App
│   ├── android/        # Native Android files
│   ├── ios/            # Native iOS files
│   └── src/            # Components, Screens, Navigation
├── admin-dashboard/    # Next.js 15 Admin Panel
│   ├── app/            # App Router pages
│   └── components/     # Reusable UI elements
├── api/                # Helper API utilities
└── public/             # Static assets & Documentation
```

---

## 🔒 Security & Performance
- **Data Integrity**: Prisma ensures strict type safety between the API and Database.
- **Socket Efficiency**: Optimized WebSocket namespaces for distinct user/bouncer channels.
- **Fast Refresh**: Optimized Metro configuration for rapid mobile development.
- **Role-Based Access**: Granular control for Admin, User, and Bouncer roles.

---

## 📄 License
Distributed under the ISC License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ by the ShieldHire Team
</p>

