# CLAUDE.md — KTV Singer Server

## Overview

Express REST API + Socket.IO server for the KTV Singer karaoke system.

## Build & Dev

```bash
npm run dev       # Dev server with hot reload (port 4040)
npm run check     # TypeScript type check
npm run build     # Production bundle (esbuild)
npm run db:push   # Push Drizzle schema to Supabase PostgreSQL
```

## Structure

- `server/` — All server source code
- `server/index.ts` — Express app entry point
- `server/routes.ts` — Route registration
- `server/db.ts` — Database connection
- `server/storage.ts` — Storage interface
- `server/features/` — Feature modules (auth, search, songs, playlist, scoring, vocal-separation, streaming, pairing)
- `server/middleware/` — Auth middleware

## Dependencies

- `ktv-singer-shared` — local package (`file:../ktv-singer-shared`) for Drizzle schemas and Socket.IO types

## Path Aliases

- `@shared/*` → `./node_modules/ktv-singer-shared/*`

## Rules

- Feature modules are isolated — no cross-feature imports
- Always export through `index.ts` barrel files
- Run `npm run check` after changes to verify TypeScript
- Do not modify shared schemas without running `db:push`
- Auth is optional in dev — middleware gracefully skips when not configured
- Port 4040 for Express + Socket.IO
- `yt-dlp` must be installed on the host machine
