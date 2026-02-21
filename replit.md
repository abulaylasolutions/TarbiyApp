# TarbiyApp - replit.md

## Overview

TarbiyApp is a mobile application for Muslim parents to monitor and manage the Islamic education of their children. It allows two parents (co-parents) to sync and collaborate on tracking their children's progress. The app follows a freemium model where the free tier supports 1 child, and premium ($2/month or $20/year) unlocks unlimited children and extra features.

The project is built as an Expo React Native app (targeting iOS, Android, and web) with an Express.js backend server and PostgreSQL database. The frontend and backend share a common schema definition using Drizzle ORM.

**Core features:**
- Email/password authentication with session-based auth
- Profile completion flow (name, birth date, gender, photo)
- Co-parent pairing via unique 6-character invite codes
- Child management (add/remove children with name, birth date, photo, avatar selection)
- Shared bulletin board (bacheca) for notes between parents
- Dashboard for per-child tracking (placeholder)
- Settings with premium subscription management

**Language:** The app UI is in Italian.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo/React Native)

- **Framework:** Expo SDK 54 with expo-router v6 for file-based routing
- **State Management:** React Context API (`AuthProvider`, `AppProvider`) + TanStack React Query for server state
- **Navigation:** File-based routing via expo-router with a tab layout (`(tabs)/`) containing 4 tabs: Home, Dashboard, Bacheca, Settings
- **Styling:** React Native StyleSheet with a pastel color theme (mint green, peach pink, sky blue, cream beige). Font: Nunito (Google Fonts). Generous border radius (24-32px), soft shadows
- **Animations:** react-native-reanimated for fade/zoom transitions
- **Auth Flow:** `app/index.tsx` acts as a router guard — checks auth state and redirects to `/auth`, `/profile-completion`, or `/(tabs)` accordingly
- **Platform Compatibility:** Uses `KeyboardAwareScrollViewCompat` for cross-platform keyboard handling. Platform-specific checks for web vs native throughout

### Backend (Express.js)

- **Runtime:** Node.js with TypeScript (tsx for dev, esbuild for production builds)
- **Framework:** Express 5
- **Authentication:** Session-based auth using `express-session` with `connect-pg-simple` for PostgreSQL session storage. Passwords hashed with bcryptjs
- **API Structure:** RESTful JSON API under `/api/` prefix
  - `/api/auth/*` — login, register, logout, profile completion, current user
  - `/api/children/*` — CRUD for children
  - `/api/notes/*` — CRUD for bulletin board notes
  - `/api/cogenitore/*` — pair/unpair co-parents, get co-parent info
  - `/api/premium/*` — premium subscription management
  - `/api/custom-photos` — GET per-user custom photos map, POST `/:childId` upserts custom photo
  - `/api/upload` — photo upload with JPEG conversion (sharp)
- **CORS:** Dynamic CORS configuration supporting Replit dev/deployment domains and localhost
- **Middleware:** `requireAuth` middleware protects authenticated endpoints

### Database (PostgreSQL + Drizzle ORM)

- **ORM:** Drizzle ORM with `drizzle-zod` for validation schema generation
- **Schema location:** `shared/schema.ts` (shared between frontend and backend)
- **Tables:**
  - `users` — id (UUID), email, password, name, birthDate, gender, photoUrl, personalInviteCode (unique 6-char), pairedCogenitore (foreign reference to another user), isProfileComplete, isPremium, createdAt
  - `children` — id (UUID), userId, name, birthDate, photoUri, createdAt
  - `child_custom_photos` — id (UUID), userId, childId, photoUrl, createdAt. Unique on (userId, childId). Each parent stores their own custom photo per child.
  - `notes` — id (UUID), userId, text, color, rotation, author, createdAt
- **Migrations:** Managed via `drizzle-kit push` (schema push approach, not migration files)
- **Connection:** PostgreSQL via `pg` Pool, connection string from `DATABASE_URL` env var

### Shared Code

- `shared/schema.ts` — Database schema definitions and Zod validation schemas shared between server and client
- Path aliases: `@/*` maps to project root, `@shared/*` maps to `./shared/*`

### Build & Deployment

- **Dev mode:** Two processes — `expo:dev` for the Expo dev server and `server:dev` for the Express backend
- **Production:** `expo:static:build` creates a static web export, `server:build` bundles the server with esbuild, `server:prod` runs the production server which serves the static build
- **Environment:** Relies on Replit environment variables (`REPLIT_DEV_DOMAIN`, `REPLIT_DOMAINS`, `DATABASE_URL`, `SESSION_SECRET`)

## External Dependencies

### Database
- **PostgreSQL** — Primary data store, required via `DATABASE_URL` environment variable
- **connect-pg-simple** — Session storage in PostgreSQL

### Key NPM Packages
- **drizzle-orm + drizzle-kit** — Database ORM and schema management
- **express + express-session** — HTTP server and session management
- **bcryptjs** — Password hashing
- **@tanstack/react-query** — Server state management on the client
- **expo ecosystem** — expo-router, expo-image, expo-haptics, expo-clipboard, expo-linear-gradient, expo-blur, expo-font, etc.
- **react-native-reanimated** — Animations
- **react-native-gesture-handler** — Gesture support
- **react-native-keyboard-controller** — Keyboard-aware scrolling on native
- **zod + drizzle-zod** — Runtime validation

### Environment Variables Required
- `DATABASE_URL` — PostgreSQL connection string (required)
- `SESSION_SECRET` — Express session secret (falls back to default, should be set in production)
- `EXPO_PUBLIC_DOMAIN` — Public domain for API requests from the client
- `REPLIT_DEV_DOMAIN` — Replit development domain (auto-set by Replit)