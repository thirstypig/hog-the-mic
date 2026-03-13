# CLAUDE.md — KTV Singer App (Mobile)

## Overview

Expo React Native mobile client for KTV Singer. iOS, Android, and web.

## Build & Dev

```bash
npm start               # Expo dev server (port 3040)
npm run ios             # iOS simulator
npm run check           # TypeScript type check
```

## Structure

- `src/features/` — Feature modules (auth, library, player, playlist, scoring, search, vocal-separation, pairing, mic)
- `src/common/` — Shared components, hooks, utils, API client
- `src/screens/` — Screen components
- `src/navigation/` — React Navigation config
- `src/theme/` — NativeWind theme, colors
- `App.tsx` — App entry point

## Path Aliases

- `@common/*` → `./src/common/*`
- `@features/*` → `./src/features/*`
- `@shared/*` → `./node_modules/ktv-singer-shared/*`
- `@navigation/*` → `./src/navigation/*`
- `@screens/*` → `./src/screens/*`
- `@theme/*` → `./src/theme/*`

## Dependencies

- `ktv-singer-shared` — local package (`file:../ktv-singer-shared`) for Drizzle schemas and Socket.IO types

## Rules

- Feature modules are isolated — no cross-feature imports
- Always export through `index.ts` barrel files
- Run `npm run check` after changes
- NativeWind (Tailwind CSS) for styling
- Functional components only
- React Query for server state
