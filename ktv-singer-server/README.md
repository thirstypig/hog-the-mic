# ktv-singer-server

Express REST API + Socket.IO server for the KTV Singer karaoke system.

## Setup

```bash
npm install
cp .env.example .env  # Fill in DATABASE_URL, YOUTUBE_API_KEY, etc.
npm run dev            # Dev server on port 4040
```

## Prerequisites

- Node.js 20+
- `yt-dlp` installed (`brew install yt-dlp`)
- Supabase PostgreSQL (see `.env.example`)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload (port 4040) |
| `npm run check` | TypeScript type check |
| `npm run build` | Bundle for production (esbuild) |
| `npm start` | Run production bundle |
| `npm run db:push` | Push Drizzle schema to database |

## Features

- REST API for songs, playlists, search, auth, scoring, vocal separation
- Socket.IO for device pairing, song queue, and microphone audio relay
- YouTube stream URL extraction via `yt-dlp`
- Passport.js with optional Google OIDC authentication

## Dependencies

- `ktv-singer-shared` — shared Drizzle schemas and Socket.IO type contracts
