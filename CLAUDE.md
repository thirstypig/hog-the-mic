# CLAUDE.md — KTV Singer

## Project Overview

YouTube-powered karaoke monorepo: Express API server + React Native mobile client + native tvOS app. The web client (Vite+React) has been removed; all frontend work is in `mobile/`.

## Monorepo Layout

- `server/` — Express REST API (Node.js, TypeScript, ES modules)
- `mobile/` — Expo React Native app (iOS, Android, web)
- `tvos/` — Native tvOS app (SwiftUI, AVPlayer, working MVP)
- `shared/` — Drizzle ORM schemas shared between server and mobile
- `docs/tvos/` — tvOS setup and architecture documentation

## Build & Dev Commands

### Server (run from project root)

```bash
npm run dev:server      # Dev server with hot reload (port 4040)
npm run check:server    # TypeScript type check (use this to verify changes)
npm run build:server    # Production bundle (esbuild)
npm run db:push         # Push Drizzle schema to Supabase PostgreSQL
```

### Mobile (run from mobile/)

```bash
npm start               # Expo dev server (port 3040)
npm run ios             # iOS simulator
npm run check           # TypeScript type check
```

### tvOS (run from tvos/)

```bash
xcodegen generate       # Regenerate Xcode project from project.yml
# Then open KTVSinger.xcodeproj in Xcode
```

**Building tvOS from CLI:**
```bash
# Simulator
xcodebuild -project KTVSinger.xcodeproj -scheme KTVSinger \
  -destination 'platform=tvOS Simulator,name=Apple TV' build

# Real device: use Xcode GUI (needs signing)
```

**Testing on Apple TV (real device):**
1. Pair Apple TV via Xcode → Window → Devices and Simulators
2. Set signing team in Xcode (Signing & Capabilities tab)
3. Select your Apple TV as destination, press Cmd+R
4. First run: trust developer profile on Apple TV (Settings → General → Device Management)
5. **Server must be running** on your Mac and reachable from Apple TV's network

## Feature Module Pattern

Both server and mobile use isolated feature modules under `features/`. Each feature has:
- A barrel `index.ts` exporting only its public API
- No cross-feature imports (features only import from `@shared`, `@common`, or their own files)
- Server features: `*.routes.ts`, `*.storage.ts`, types
- Mobile features: `components/`, `hooks/`, `types/`, `utils/`

Server features: auth, search, songs, playlist, scoring, vocal-separation, streaming, pairing
Mobile features: auth, library, player, playlist, scoring, search, vocal-separation, pairing

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
- `tvos/project.yml` — XcodeGen project spec (source of truth for Xcode project)
- `tvos/KTVSingerApp.swift` — tvOS app entry point
- `tvos/Shared/Networking/APIClient.swift` — HTTP client for Express API
- `tvos/Shared/Database/SupabaseClient.swift` — Supabase auth wrapper (`AppSupabaseClient`)
- `tvos/Shared/Models/Song.swift` — Song model (matches server schema)
- `tvos/Shared/Models/QueueEntry.swift` — Queue entry model for shared song queue
- `tvos/Shared/Services/QueueService.swift` — Queue state management via Socket.IO
- `tvos/Features/Player/` — Player view, view model, YouTube/lyrics services
- `tvos/Features/Player/Views/QueuePlayerView.swift` — Queue-driven player with auto-advance
- `tvos/Features/SongBrowser/` — Song browser view and view model
- `tvos/Features/Pairing/` — QR code pairing view and socket.io service
- `server/features/pairing/` — Pairing REST endpoints + Socket.IO namespace + queue logic
- `server/features/streaming/` — YouTube stream URL extraction via yt-dlp
- `mobile/src/features/pairing/` — QR scanner, socket client, pairing hooks, queue hook
- `mobile/src/screens/PairScreen.tsx` — Pairing screen (QR scan + queue management when paired)

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
- **tvOS Xcode project is generated from project.yml.** Run `xcodegen generate` in `tvos/` after changing `project.yml`. Do not hand-edit `project.pbxproj`.
- **tvOS uses `AppSupabaseClient` (not `SupabaseClient`)** to avoid naming conflict with the Supabase SDK's own `SupabaseClient` class.
- **tvOS APIClient base URL** defaults to `localhost:4040` (works on simulator). Physical devices get the server URL from QR code pairing or manual entry in Settings.
- **Port assignments**: See `PORTS.md` for this project's port assignments. Express API runs on port **4040** (default), Socket.IO shares the same port. No separate frontend server.

## tvOS Architecture Notes

- tvOS app fetches songs from Express API via `APIClient` (not direct Supabase queries)
- Supabase client on tvOS is auth-only: sign in/up, favorites (RLS)
- YouTube streaming: server extracts playable URLs via `yt-dlp` CLI → tvOS plays via AVPlayer
- Data flow: tvOS → `GET /api/songs` → Express → Supabase PostgreSQL
- Video flow: tvOS → `GET /api/youtube/stream/:videoId` → Express → yt-dlp → YouTube CDN URL → AVPlayer
- Lyrics come embedded in the song record from the server (fetched from LRCLIB at song creation time)
- Stream URLs are cached server-side for 4 hours (they expire after ~6 hours)
- AVAudioSession configured at app init with `.playback` category for reliable audio
- Bundle ID: `com.ktvsinger.tvos`, deployment target: tvOS 17.0
- SPM dependency: `supabase-swift` v2.0.0+
- PlayerView uses GeometryReader for responsive layout (proportional sizing, not hardcoded pixels)
- QueuePlayerView auto-advances through songs when queue is active

## Song Queue Architecture

- **Server**: Queue state stored on PairingSession (in-memory, ephemeral). Socket.IO events manage the queue lifecycle.
- **Queue flow**: Phone adds song → server checks if queue empty → auto-plays first song or appends to queue → broadcasts state to all devices
- **Auto-advance**: When TV reports `song_finished`, server shifts next song from queue and emits `play_song`
- **Socket.IO events (queue)**: `add_to_queue`, `remove_from_queue`, `skip_song`, `song_finished` (client→server); `queue_updated`, `play_song` (server→client)
- **tvOS**: QueueService observes socket events, QueuePlayerView loads songs from API and auto-advances. Opens as fullScreenCover when queue starts.
- **Mobile**: useQueue hook provides `currentlyPlaying`, `upcoming`, `addToQueue()`, `removeFromQueue()`, `skipSong()`. HomeScreen/SearchScreen add to queue when paired.
- **Design principle**: tvOS = clean video + lyrics display only. All search, queue management, and song discovery happens on the mobile device.

## Device Pairing Architecture

- **Server**: Ephemeral in-memory sessions (4-hour TTL), REST endpoints + Socket.IO `/pairing` namespace
- **tvOS (TV role)**: Creates session via `POST /api/pairing/sessions`, generates QR code with `{serverURL, sessionId}`, connects as TV via Socket.IO
- **Mobile (Singer role)**: Scans QR code with expo-camera, connects to server via Socket.IO as singer
- **Flow**: TV creates session → shows QR → phone scans QR → both connect to Socket.IO room → real-time roster sync
- **Socket.IO events**: `join_session`, `singer_joined`, `singer_left`, `session_state`, `audio_chunk` (Phase 2 stub), `score_update` (Phase 3 stub)
- **Dependencies**: `socket.io` (server), `socket.io-client` (mobile), `socket.io-client-swift` (tvOS via SPM)
- **Reconnection**: tvOS SocketPairingService uses unlimited reconnect attempts and re-joins session on reconnect

## YouTube Streaming (yt-dlp)

- **Requires**: `yt-dlp` installed on the host machine (`brew install yt-dlp`)
- **How it works**: Server shells out to `yt-dlp` via `child_process.execFile()` to extract direct playable URLs
- **Format selection**: `best[ext=mp4]` for combined video+audio mp4 (AVPlayer compatible)
- **Caching**: 4-hour TTL in-memory cache (YouTube URLs expire ~6 hours)
- **Replaced**: `@distube/ytdl-core` (archived Aug 2025, stopped working)

## Mobile iOS Build

- Run `npx expo run:ios --device <UDID>` to build for physical iPhone
- Find UDID: `xcrun xctrace list devices`
- First run on device: trust developer profile in Settings → General → VPN & Device Management
- Metro bundler must be running (`npx expo start --dev-client`) for dev builds
- `mobile/ios/` is gitignored (generated by Expo prebuild)

## Known Issues

- Free Apple Developer account: apps on real device expire after 7 days, need re-deploy
- tvOS `.onTapGesture` doesn't work with Siri Remote — always use `Button` for selectable elements
- `yt-dlp` must be installed on the server host — streaming will fail without it
