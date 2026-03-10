# KTV Singer — Roadmap

> Last updated: 2026-03-10

## Polish / Tech Debt

- [ ] Replace hardcoded LAN IP `192.168.6.12` with `localhost` defaults in source code; use env var or config for physical device builds
  - Files: `mobile/src/common/lib/api.ts`, `mobile/src/screens/PairScreen.tsx`, `tvos/Shared/Networking/APIClient.swift`
- [ ] Fix `npm run check:server` script — references nonexistent `tsconfig.server.json`; should use `tsc --noEmit`

## Feature Work

- [ ] **Scoring in queue flow** — scoring feature exists server-side but isn't wired into the pairing/queue session
- [ ] **Vocal separation UI** — LaLaL.ai/Gaudio integration exists server-side but no mobile UI triggers it
- [ ] **Playlist → queue** — playlists exist but can't be loaded into the shared song queue (e.g., "play this playlist")
- [ ] **CI/CD pipeline** — Dockerfile is ready but no automated build/deploy exists
- [ ] **Production deployment** — deploy to Railway or Render (docs exist in `docs/deployment.md`)

## UX Improvements

- [ ] Drag-to-reorder in song queue (currently move-up/move-down buttons only)
- [ ] Persist lyrics offset per song (currently resets each song)
- [ ] Reconnection UX — graceful handling when phone loses connection mid-session (toast, auto-rejoin)
