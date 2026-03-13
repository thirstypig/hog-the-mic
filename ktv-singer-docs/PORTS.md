# KTV Singer — Port Registry
> Last Updated: 2026-03-10

## This Project's Ports

| Service              | Port | Config                                     | Notes                                      |
|----------------------|------|--------------------------------------------|--------------------------------------------|
| Expo Dev Server      | 3040 | `npm start` (from mobile/)                 | Expo Metro bundler for React Native dev    |
| Express API + WS     | 4040 | `PORT=4040` in `.env` or env var           | Express + Socket.IO on same HTTP server    |
| PostgreSQL           | —    | Supabase cloud                             | No local PG; Drizzle connects via `DATABASE_URL` |
| Redis                | 6385 | `REDIS_URL=redis://localhost:6385` in `.env` | Optional; falls back to in-memory in dev |

> **Socket.IO** shares the Express HTTP server on port 4040 — there is no separate WebSocket port.
> **Port 3040** is the Expo Metro bundler (set via `--port 3040` in `mobile/package.json`).
> See `.env.example` for all environment variables including port configuration.
