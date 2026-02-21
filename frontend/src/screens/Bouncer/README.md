# Bouncer Module

This folder contains all screens and components related to the Bouncer/Gunman functionality.

## Current Screens

### BouncerRegistrationScreen.tsx
Complete registration form for bouncers and gunmen including:
- Personal information (name, contact, age, gender)
- Profile photo upload
- Government ID verification
- Gun license verification (optional)
- Automatic role assignment (BOUNCER vs GUNMAN)

## Planned Screens

Future screens that can be added to this module:

### BouncerDashboardScreen.tsx
- View available security assignments
- Track earnings
- View ratings and reviews
- Manage availability status

### BouncerProfileScreen.tsx
- Edit personal information
- Update documents
- Manage certifications
- View work history

### BouncerJobsScreen.tsx
- Browse available jobs
- Apply for assignments
- View job details
- Track application status

### BouncerEarningsScreen.tsx
- View payment history
- Track pending payments
- Download invoices
- View earnings analytics

## Usage

Import screens from this module:
```typescript
import { BouncerRegistrationScreen } from './screens/Bouncer';
```

## Navigation

All bouncer screens should be added to the appropriate navigator in `App.tsx`.

## Styling

All bouncer screens follow the app's dark theme:
- Background: #0F0F0F
- Card: #1E1E1E
- Primary: #FFD700 (Gold)
- Text: #FFFFFF
