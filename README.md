# KTV Singer

YouTube-powered karaoke system with real-time device pairing, synced lyrics, and shared song queue.

**[/tech page](http://localhost:4040/tech)** — full technical overview with architecture diagrams, build journal, and project stats.

## Sub-Projects

All sub-projects live in this directory, each with its own git repo:

| Directory | Description | Status |
|-----------|-------------|--------|
| [`ktv-singer-shared`](https://github.com/thirstypig/ktv-singer-shared) | Drizzle ORM schemas, Socket.IO type contracts | Active |
| [`ktv-singer-server`](https://github.com/thirstypig/ktv-singer-server) | Express REST API + Socket.IO server | Active |
| [`ktv-singer-app`](https://github.com/thirstypig/ktv-singer-app) | Expo React Native mobile client (iOS, Android, web) | Active |
| [`ktv-singer-tvos`](https://github.com/thirstypig/ktv-singer-tvos) | Native Apple TV app (SwiftUI, AVPlayer) | Active |
| [`ktv-singer-docs`](https://github.com/thirstypig/ktv-singer-docs) | Documentation, roadmap, design guidelines | Active |
| [`ktv-singer-infra`](https://github.com/thirstypig/ktv-singer-infra) | Docker, CI/CD configuration | Placeholder |
| [`ktv-singer-web`](https://github.com/thirstypig/ktv-singer-web) | Placeholder for future web client | Placeholder |

## Architecture

```
Phone (Expo)                    Apple TV (SwiftUI)
  |                                |
  +-- REST ------------+  +------ REST
  +-- Socket.IO -------+  +--- Socket.IO
  +-- Audio chunks ----+  +-- Audio playback
                       |  |
                 Express API (port 4040)
                 +-- /api/songs --> Supabase PostgreSQL
                 +-- /api/youtube/stream/:id --> yt-dlp --> YouTube CDN
                 +-- Socket.IO /pairing --> queue, audio relay
```

## Quick Start

```bash
# Start the server
cd ktv-singer-server && npm install && npm run dev

# Start the mobile app (separate terminal)
cd ktv-singer-app && npm install && npm start

# tvOS
cd ktv-singer-tvos && xcodegen generate  # then Cmd+R in Xcode
```

## Docs

- [SYSTEM_OVERVIEW.md](ktv-singer-docs/SYSTEM_OVERVIEW.md) — full technical overview
- [ROADMAP.md](ktv-singer-docs/ROADMAP.md) — feature roadmap
- [SECURITY_AND_OPS.md](ktv-singer-docs/SECURITY_AND_OPS.md) — security audit
- [MODEL_SYNC.md](ktv-singer-docs/MODEL_SYNC.md) — cross-repo type alignment
