# KTV Singer

YouTube-powered karaoke system with real-time device pairing, synced lyrics, and shared song queue.

## Repositories

| Folder | Description |
|--------|-------------|
| [`ktv-singer-shared/`](./ktv-singer-shared/) | Drizzle ORM schemas, Socket.IO type contracts |
| [`ktv-singer-server/`](./ktv-singer-server/) | Express REST API + Socket.IO server |
| [`ktv-singer-app/`](./ktv-singer-app/) | Expo React Native mobile client (iOS, Android, web) |
| [`ktv-singer-tvos/`](./ktv-singer-tvos/) | Native Apple TV app (SwiftUI, AVPlayer) |
| [`ktv-singer-docs/`](./ktv-singer-docs/) | Documentation, roadmap, design guidelines |
| [`ktv-singer-infra/`](./ktv-singer-infra/) | Docker, CI/CD configuration |
| [`ktv-singer-web/`](./ktv-singer-web/) | Placeholder for future web client |

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
              └── Socket.IO /pairing ──→ queue, audio relay
```

## Quick Start

```bash
# 1. Install shared package
cd ktv-singer-shared && npm install

# 2. Start the server
cd ../ktv-singer-server && npm install && npm run dev

# 3. Start the mobile app (separate terminal)
cd ../ktv-singer-app && npm install && npm start
```
