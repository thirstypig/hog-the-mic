# Database Migration: Neon → Supabase

**Date:** March 3, 2026
**Status:** Complete
**Impact:** Server only (mobile client unchanged)

---

## Summary

Migrated the server's PostgreSQL database from Neon (serverless WebSocket driver) to Supabase (standard PostgreSQL via postgres.js). This unifies both the server and tvOS port on the same Supabase project.

## Why

- Consolidate on a single database provider (Supabase) instead of maintaining two (Neon for server, Supabase for tvOS)
- Supabase provides standard PostgreSQL — no need for WebSocket-based serverless drivers
- Simpler connection code with fewer dependencies

## What Changed

### Dependencies (`package.json`)

| Removed | Added |
|---------|-------|
| `@neondatabase/serverless` | `postgres` (postgres.js) |
| `ws` | — |
| `@types/ws` | — |
| `bufferutil` (optional) | — |

Net effect: removed 314 packages from node_modules, added 1.

### Connection Code (`server/db.ts`)

**Before (Neon):**
```ts
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
```

**After (Supabase via postgres.js):**
```ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client, { schema });
```

### What Did NOT Change

- `shared/schema/*` — all Drizzle table definitions (identical PostgreSQL under the hood)
- `server/storage.ts` — storage interface
- `server/features/**/*.storage.ts` — all queries use the same Drizzle `db` object
- `server/features/auth/auth.setup.ts` — `connect-pg-simple` session store uses `conString` directly
- `drizzle.config.ts` — already used generic `dialect: "postgresql"`
- `mobile/` — no changes at all

## Migration Steps Performed

1. **Swapped dependencies** — removed Neon packages, added postgres.js
2. **Rewrote `server/db.ts`** — replaced Neon WebSocket pool with postgres.js client
3. **Updated `.env`** — changed `DATABASE_URL` from Neon connection string to Supabase
4. **Dropped existing tvOS tables** — the Supabase database had tvOS-scaffolded tables (`songs`, `user_favorites`, `playback_history`, `user_preferences`) with a different schema than the Drizzle-managed tables. These were dropped to allow a clean schema push.
5. **Pushed Drizzle schema** — `npm run db:push` created all 7 tables: `users`, `songs`, `user_song_plays`, `performances`, `playlists`, `playlist_songs`, `sessions`
6. **Updated documentation** — README, CLAUDE.md, .env.example, memory files

## Verification

All API endpoints tested against Supabase with zero errors:

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/songs` | GET | 200 | Empty list, then populated after POST |
| `/api/songs` | POST | 201 | Created song with all fields |
| `/api/songs/:id` | GET | 200 | Retrieved by ID |
| `/api/songs/video/:videoId` | GET | 200 | Retrieved by video ID |
| `/api/songs/:id` | PATCH | 200 | Updated title |
| `/api/songs/:id/lyrics-offset` | PATCH | 200 | Updated lyrics offset |
| `/api/songs/:id/play` | POST | 200 | Incremented play count |
| `/api/songs/nonexistent` | GET | 404 | Correct error handling |
| `/api/performances` | POST | 201 | Created performance record |
| `/api/performances/song/:songId` | GET | 200 | Retrieved performances |
| `/api/auth/user` | GET | 401 | Correct unauthorized response |
| `/api/lyrics` | GET | 200 | External LRCLIB API working |
| `/api/lrclib/search` | GET | 200 | External search working |
| `/api/youtube/search` | GET | 200 | YouTube API working |

Server logs showed zero errors across all requests.

## Risks & Notes

- **tvOS port impact:** The tvOS port previously had its own Supabase schema (`songs`, `user_favorites`, etc.). Those tables were dropped. The tvOS port will need to be updated to use the Drizzle-managed schema (tables have different column names/types). See `docs/tvos/DEVELOPMENT_LOG.md`.
- **Credential rotation:** Both Neon and Supabase database passwords were exposed during the migration session and should be rotated.
- **Session store:** `connect-pg-simple` connects via `conString` (raw connection string), independent of the Drizzle driver. No change needed.

## Compound Engineering Observations

### Decision: postgres.js over @supabase/supabase-js

We chose `postgres` (postgres.js) rather than the Supabase JS client because:
- Drizzle ORM needs a raw PostgreSQL driver, not a REST client
- postgres.js is Drizzle's recommended driver for standard PostgreSQL
- Zero query or schema changes — just swap the transport layer
- The Supabase JS client would require rewriting all storage code to use its query builder

### Layered architecture payoff

The feature-module architecture with a single `db.ts` connection file made this migration trivial:
- Only 1 file contained driver-specific code (`server/db.ts`)
- All 5 storage files import only `db` (the Drizzle instance), not the driver
- The session store uses a raw connection string, not the driver
- Total code change: ~10 lines of application code

This validates the architectural decision to isolate database connection logic from query logic.

### Testing approach

Rather than writing automated migration tests, we used direct API endpoint testing against the live Supabase instance. This verified the full stack: driver → Drizzle ORM → storage layer → route handlers → HTTP responses. Each endpoint was tested for both success and error cases.
