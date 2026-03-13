# KTV Singer — Roadmap

> Last updated: 2026-03-13

## Repository Split

Split monorepo into focused repositories. See [REPO_ARCHITECTURE.md](./REPO_ARCHITECTURE.md) for full details.

- [ ] **Merge current work** — commit and merge `feat/tech-debt-and-features` to `main`
- [ ] **Create repos** — `ktv-singer-shared`, `ktv-singer-server`, `ktv-singer-app`, `ktv-singer-tvos`, `ktv-singer-web` (placeholder), `ktv-singer-docs` (placeholder), `ktv-singer-infra` (placeholder)
- [ ] **Split code with history** — use `git subtree split` to preserve commit history per directory
- [ ] **Wire shared package** — install `ktv-singer-shared` as git dependency in server and app repos
- [ ] **Add Socket.IO event contracts** — typed event names and payloads in `ktv-singer-shared`
- [ ] **API versioning** — prefix all routes with `/api/v1/`
- [ ] **tvOS contract docs** — add JSON schema / markdown API contracts in shared repo for Swift model sync
- [ ] **Archive monorepo** — mark original `ktv-singer` as read-only reference

## Polish / Tech Debt

- [ ] Replace hardcoded LAN IP `192.168.6.12` with `localhost` defaults in source code; use env var or config for physical device builds
  - Files: `mobile/src/common/lib/api.ts`, `mobile/src/screens/PairScreen.tsx`, `tvos/Shared/Networking/APIClient.swift`
- [ ] Fix `npm run check:server` script — references nonexistent `tsconfig.server.json`; should use `tsc --noEmit`

## Feature Work

- [ ] **Scoring in queue flow** — scoring feature exists server-side but isn't wired into the pairing/queue session
- [ ] **Vocal separation UI** — LaLaL.ai/Gaudio integration exists server-side but no mobile UI triggers it
- [ ] **Playlist → queue** — playlists exist but can't be loaded into the shared song queue (e.g., "play this playlist")
- [ ] **Web client** — Vite + React client for browser-based access (no app download required)
- [ ] **Android support** — Expo app already supports Android; needs testing and platform-specific polish
- [ ] **CI/CD pipeline** — Dockerfile is ready but no automated build/deploy exists
- [ ] **Production deployment** — deploy to Railway or Render (docs exist in `docs/deployment.md`)
- [ ] **Infrastructure setup** — Docker configs, CI/CD pipelines, deployment scripts (`ktv-singer-infra`)

## UX Improvements

- [ ] Drag-to-reorder in song queue (currently move-up/move-down buttons only)
- [ ] Persist lyrics offset per song (currently resets each song)
- [ ] Reconnection UX — graceful handling when phone loses connection mid-session (toast, auto-rejoin)
