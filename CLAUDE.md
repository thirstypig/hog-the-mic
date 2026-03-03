# CLAUDE.md — KTV Singer

## Project Overview

YouTube-powered karaoke monorepo: Express API server + React Native mobile client + in-progress tvOS port. The web client (Vite+React) has been removed; all frontend work is in `mobile/`.

## Monorepo Layout

- `server/` — Express REST API (Node.js, TypeScript, ES modules)
- `mobile/` — Expo React Native app (iOS, Android, web)
- `tvos/` — Native tvOS port (SwiftUI, in progress)
- `shared/` — Drizzle ORM schemas shared between server and mobile
- `docs/tvos/` — tvOS setup and architecture documentation

## Build & Dev Commands

### Server (run from project root)

```bash
npm run dev:server      # Dev server with hot reload (port 3000)
npm run check:server    # TypeScript type check (use this to verify changes)
npm run build:server    # Production bundle (esbuild)
npm run db:push         # Push Drizzle schema to Supabase PostgreSQL
```

### Mobile (run from mobile/)

```bash
npm start               # Expo dev server
npm run ios             # iOS simulator
npm run check           # TypeScript type check
```

## Feature Module Pattern

Both server and mobile use isolated feature modules under `features/`. Each feature has:
- A barrel `index.ts` exporting only its public API
- No cross-feature imports (features only import from `@shared`, `@common`, or their own files)
- Server features: `*.routes.ts`, `*.storage.ts`, types
- Mobile features: `components/`, `hooks/`, `types/`, `utils/`

Server features: auth, search, songs, playlist, scoring, vocal-separation, streaming
Mobile features: auth, library, player, playlist, scoring, search, vocal-separation

## Path Aliases

### Server (tsconfig.json)
- `@shared/*` → `./shared/*`

### Mobile (mobile/tsconfig.json + babel.config.js)
- `@common/*` → `./src/common/*`
- `@features/*` → `./src/features/*`
- `@shared/*` → `../shared/*`
- `@navigation/*` → `./src/navigation/*`
- `@screens/*` → `./src/screens/*`
- `@theme/*` → `./src/theme/*`

## Database

- **ORM:** Drizzle ORM with Supabase PostgreSQL (`postgres.js`)
- **Schema:** `shared/schema/` — songs, users, playlists, plays, performances, sessions
- **Barrel:** `shared/schema/index.ts` re-exports all tables
- **Validation:** Drizzle-Zod for runtime validation
- **Migrations:** `drizzle-kit push` (schema-push, not migration files)

## Auth

- Passport.js with optional Google OIDC (`openid-client`)
- Auth is optional in development — middleware gracefully skips when not configured
- Session storage: `connect-pg-simple` (PostgreSQL) or `memorystore` (dev fallback)
- Auth middleware is in `server/middleware/auth.middleware.ts`

## Code Style

- TypeScript strict mode everywhere
- ES modules (`"type": "module"` in root package.json)
- Zod for all API input validation
- React Query (`@tanstack/react-query`) for server state in mobile
- NativeWind (Tailwind CSS) for mobile styling
- Functional components only (no class components)
- `async/await` over raw promises

## Key File Paths

- `server/index.ts` — Express app entry point
- `server/routes.ts` — Route registration
- `server/db.ts` — Database connection
- `server/storage.ts` — Storage interface
- `shared/schema/` — All Drizzle table definitions
- `mobile/App.tsx` — Mobile app entry point
- `mobile/src/screens/` — Screen components (4 screens)
- `mobile/src/features/` — Feature modules
- `mobile/src/common/` — Shared components, hooks, utils

## Rules

- **Do not import across features.** Features are isolated modules. Use `@shared` for shared types, `@common` for shared UI/hooks.
- **Do not add a web client.** The Vite+React client was intentionally removed. The mobile app serves web via Expo.
- **Do not change the database provider.** The server uses Supabase PostgreSQL with Drizzle.
- **Always export through index.ts barrel files.** Never import from a feature's internal files directly.
- **Run `npm run check:server` after server changes** to verify TypeScript compilation.
- **Run `npm run check` in mobile/ after mobile changes** to verify TypeScript compilation.
- **Do not install new dependencies without asking.** The dependency set is intentionally minimal.
- **Keep feature modules self-contained.** New functionality should be a new feature module or extend an existing one, not scattered across the codebase.
- **Preserve the auth-optional pattern.** Dev mode must work without Google OIDC credentials configured.
- **Do not modify shared/schema without running db:push.** Schema changes require a database migration step.
