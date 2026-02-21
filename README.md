# ShieldHire

## Getting Started

This project is a monorepo containing the backend, mobile app (frontend), and admin dashboard.

### Prerequisites

- Node.js installed
- npm installed
- Android/iOS development environment set up (for mobile app)

### Installation

To install all dependencies for the root, backend, frontend, and admin dashboard, run:

```bash
npm run install:all
```

### Running the App

To start the backend, frontend, and admin dashboard concurrently, run:

```bash
npm start
```
This command uses `concurrently` to run:
- **Backend**: `npm run dev` (starts the server on port 5000)
- **Frontend (Metro)**: `npm start` (starts the Metro bundler on port 8081)
- **Admin Dashboard**: `npm run dev` (starts the Next.js app on port 3000)

To run the Android app along with all services, run:

```bash
npm run android
```
This will also build and install the Android app on a connected device/emulator.

### Directory Structure

- `frontend/`: React Native CLI project
- `backend/`: Node.js Express project with TypeScript and Prisma
- `admin-dashboard/`: Next.js Admin Dashboard
