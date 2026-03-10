# KTV Singer

YouTube-powered karaoke system with real-time device pairing, synced lyrics, and a shared song queue. Monorepo with an Express API server, React Native mobile client, and native tvOS app.

## Tech Stack

### Frontend (Mobile)

- **Expo React Native** — iOS, Android, web
- **React Navigation** — stack + bottom tab navigation
- **NativeWind** — Tailwind CSS for React Native
- **React Query** (`@tanstack/react-query`) — server state management
- **expo-camera** — QR code scanning for device pairing
- **expo-av** — microphone recording
- **react-native-qrcode-svg** — QR code display for session hosting
- **socket.io-client** — real-time pairing, queue sync, audio relay

### Frontend (tvOS)

- **SwiftUI** — tvOS 17.0+, XcodeGen for project generation
- **AVPlayer** — YouTube video playback via server-extracted stream URLs
- **Socket.IO Swift client** — real-time queue sync, audio relay
- **Supabase Swift SDK** v2 — auth only (favorites with RLS)

### Backend

- **Node.js + Express** — TypeScript, ES modules
- **Socket.IO** — real-time pairing, song queue, microphone audio relay
- **Drizzle ORM** — type-safe database access (`postgres.js` driver)
- **Passport.js** — optional Google OIDC authentication
- **yt-dlp** — YouTube stream URL extraction (CLI, not npm package)
- **Zod** — API input validation
- **esbuild** — production bundler

### Shared

- **Drizzle ORM schemas** (`shared/schema/`) — songs, users, playlists, plays, performances, sessions
- **Drizzle-Zod** — runtime validation generated from DB schema
- **TypeScript strict mode** — enforced across all packages

### Infrastructure

- **Supabase PostgreSQL** — cloud-hosted, connected via `DATABASE_URL`
- **Redis** — optional (`REDIS_URL`), falls back to in-memory in dev
- **Express API on port 4040** — Socket.IO shares the same HTTP server
- **Docker** — production deployment support (see `docs/deployment.md`)

> See `PORTS.md` for this project's port assignments.

## Features

- **Device pairing** — TV creates session, phone scans QR code, real-time Socket.IO sync
- **Shared song queue** — phone searches and queues songs, TV auto-plays and advances
- **YouTube playback** — server extracts stream URLs via yt-dlp, tvOS plays via AVPlayer
- **Synced lyrics** — fetched from LRCLIB, displayed with word-level timing and adjustable offset
- **Microphone streaming** — phone captures audio, relays to TV via Socket.IO
- **YouTube search** — search karaoke videos via YouTube Data API
- **Scoring** — track play history and performance scores
- **Playlists** — create and manage song collections
- **Vocal separation** — isolate vocals/instrumentals via LaLaL.ai and Gaudio
- **Auth** — Google OIDC via Passport.js (optional in dev)

## Architecture

```
Phone (Expo)                    Apple TV (SwiftUI)
  │                                │
  ├─ REST ──────────┐  ┌──────── REST
  ├─ Socket.IO ─────┤  ├─── Socket.IO
  └─ Audio chunks ──┤  ├── Audio playback
                    │  │
              Express API (port 4040)
              ├── /api/songs ──→ Supabase PostgreSQL
              ├── /api/youtube/stream/:id ──→ yt-dlp ──→ YouTube CDN
              ├── /api/pairing/* ──→ session management
              └── Socket.IO /pairing ──→ queue, audio relay
```

**Design principle**: tvOS = clean video + lyrics display only. All search, queue management, and song discovery happens on the mobile device.

## Getting Started

### Prerequisites

- Node.js 20+
- yt-dlp (`brew install yt-dlp`)
- Supabase project with `DATABASE_URL`
- YouTube Data API key (`YOUTUBE_API_KEY`)

### Setup

```bash
# Install dependencies
npm install
cd mobile && npm install && cd ..

# Push database schema
npm run db:push

# Start the dev server (API on port 4040)
npm run dev:server

# In a separate terminal, start the mobile app
cd mobile && npm start   # Expo on port 3040
```

### Environment Variables

Create a `.env` file in the project root:

```
DATABASE_URL=postgresql://...
YOUTUBE_API_KEY=...
SESSION_SECRET=...
GOOGLE_CLIENT_ID=...       # optional in dev
GOOGLE_CLIENT_SECRET=...   # optional in dev
REDIS_URL=...              # optional, in-memory fallback
```

## Monorepo Layout

| Directory | Purpose |
|-----------|---------|
| `server/` | Express REST API + Socket.IO (pairing, queue, streaming, search, auth) |
| `mobile/` | Expo React Native app (iOS, Android, web) |
| `tvos/` | Native Apple TV app (SwiftUI, AVPlayer) |
| `shared/` | Drizzle ORM schemas shared between server and mobile |
| `docs/` | Extended documentation (tvOS setup, deployment) |

## Dev Commands

### Server (from project root)

| Command | Description |
|---------|-------------|
| `npm run dev:server` | Start dev server with hot reload (port 4040) |
| `npx tsc --noEmit` | TypeScript type check |
| `npm run build:server` | Bundle for production (esbuild) |
| `npm run db:push` | Push Drizzle schema to database |

### Mobile (from `mobile/`)

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server (port 3040) |
| `npm run ios` | Run on iOS simulator |
| `npm run check` | TypeScript type check |
| `npx expo run:ios --device <UDID>` | Build for physical iPhone |

### tvOS (from `tvos/`)

| Command | Description |
|---------|-------------|
| `xcodegen generate` | Regenerate Xcode project from `project.yml` |
| Cmd+R in Xcode | Build and run on simulator or device |

## Project Structure

```
ktv-singer/
├── server/
│   ├── features/
│   │   ├── auth/              # Passport.js, Google OIDC, sessions
│   │   ├── search/            # YouTube API, LRCLIB lyrics
│   │   ├── songs/             # Song CRUD
│   │   ├── playlist/          # Playlist management
│   │   ├── scoring/           # Play tracking, performance scores
│   │   ├── vocal-separation/  # LaLaL.ai, Gaudio integration
│   │   ├── streaming/         # YouTube stream URL extraction (yt-dlp)
│   │   └── pairing/           # Device pairing, song queue, Socket.IO
│   ├── middleware/             # Auth middleware
│   ├── routes.ts              # Route registration
│   ├── storage.ts             # Storage interface
│   ├── db.ts                  # Supabase/Drizzle connection
│   └── index.ts               # Express app entry point
├── mobile/
│   └── src/
│       ├── features/
│       │   ├── auth/          # Auth context, login
│       │   ├── library/       # Song library browsing
│       │   ├── search/        # YouTube + LRCLIB search, genre pills
│       │   ├── pairing/       # Socket client, pairing/queue hooks
│       │   ├── mic/           # Microphone capture + streaming
│       │   ├── playlist/      # Playlist management
│       │   ├── scoring/       # Play tracking
│       │   └── vocal-separation/
│       ├── common/            # Shared components, hooks, utils, API client
│       ├── navigation/        # React Navigation config
│       ├── screens/           # Screen components
│       └── theme/             # NativeWind theme, colors
├── tvos/
│   ├── Shared/                # Models, Networking, Database, Services
│   └── Features/              # Player, SongBrowser, Pairing, Settings
├── shared/
│   └── schema/                # Drizzle ORM table definitions
└── docs/                      # tvOS guides, deployment docs
```

## Feature Module Pattern

Both server and mobile use isolated feature modules:

- Each feature exports through `index.ts` barrel file
- No cross-feature imports (features only import from `@shared`, `@common`, or their own files)
- Server features: `*.routes.ts`, `*.storage.ts`, types
- Mobile features: `components/`, `hooks/`, `types/`, `utils/`

## tvOS App

Working MVP tested on Apple TV Simulator and real Apple TV 4K hardware.

- Song queue driven by phone — TV auto-plays and advances
- YouTube video playback via AVPlayer (server-extracted stream URLs)
- Synced lyrics display with adjustable offset
- QR code pairing with mobile devices
- Microphone audio playback from paired phones
- Favorites (requires Supabase auth)

### Testing on Real Apple TV

1. **Pair** your Apple TV in Xcode (Window → Devices and Simulators)
2. **Sign** the app (Signing & Capabilities → select your team)
3. **Update server URL** in `tvos/Shared/Networking/APIClient.swift` to your Mac's LAN IP (e.g., `http://192.168.x.x:4040`), or change it in-app via Settings
4. **Build and run** (Cmd+R) with Apple TV selected
5. **Trust developer** on Apple TV (Settings → General → Device Management) on first run

See `docs/tvos/QUICK_START.md` for detailed setup instructions.

## Project Status

| Component | Status |
|-----------|--------|
| Server API | Working |
| Mobile (Expo) | Working — pairing, queue, mic, search |
| tvOS (SwiftUI) | Working MVP — playback, queue, lyrics, pairing |
| Web client | Removed (migrated to React Native) |

## License

MIT
