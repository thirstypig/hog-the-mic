# KTV Singer — Repository Architecture

> Last updated: 2026-03-13

## Overview

KTV Singer is being split from a single monorepo into multiple focused repositories. Each repo owns one concern, enabling cleaner boundaries, independent version history, and easier onboarding per platform.

## Repository Plan

| Repo | Contents | Status |
|------|----------|--------|
| `ktv-singer-shared` | Drizzle schemas, TypeScript types, Socket.IO event contracts | Active |
| `ktv-singer-server` | Express API + Socket.IO backend | Active |
| `ktv-singer-app` | Expo React Native (iOS + Android) | Active |
| `ktv-singer-tvos` | SwiftUI tvOS app | Active |
| `ktv-singer-web` | Vite + React web client | Placeholder |
| `ktv-singer-docs` | Architecture docs, roadmap, design guidelines | Placeholder |
| `ktv-singer-infra` | Docker configs, CI/CD pipelines, deployment scripts | Placeholder |

## How Repos Connect

```
                    ktv-singer-shared (npm package via git)
                   /          |
                  /           |
    ktv-singer-server    ktv-singer-app
         |    \               |
    REST | Socket.IO     Socket.IO + REST
         |      \             |
    ktv-singer-tvos      ktv-singer-web (future)
```

- **ktv-singer-shared** is installed as a git dependency by `ktv-singer-server` and `ktv-singer-app`
- **ktv-singer-tvos** is pure Swift — it consumes the server's REST API and Socket.IO events but cannot import the shared npm package directly
- **ktv-singer-web** (future) will also depend on `ktv-singer-shared`

## Shared Package (`ktv-singer-shared`)

### What goes here
- Drizzle ORM table schemas (`shared/schema/`)
- TypeScript types shared between server and clients
- Socket.IO event contracts (event names, payload types, enums)
- Zod validation schemas used by both server and clients

### Installation
Server and app repos install via git dependency:
```json
{
  "dependencies": {
    "ktv-singer-shared": "github:thirstypig/ktv-singer-shared"
  }
}
```

## Key Recommendations

### 1. Socket.IO Event Contracts

Define all Socket.IO events in `ktv-singer-shared` as a single source of truth:
- Event name constants (e.g., `EVENTS.QUEUE.ADD`, `EVENTS.QUEUE.REORDER`)
- Payload type definitions for each event
- Shared enums (device roles, queue actions, etc.)

This prevents the "server emits X but the app expects Y" bugs that happen when event definitions are scattered across repos.

### 2. tvOS Model Sync Strategy

Since tvOS is Swift and cannot use the shared npm package, keep its models (`Song.swift`, `QueueEntry.swift`, etc.) manually in sync. To help:
- `ktv-singer-shared` should include a `contracts/` directory with JSON schema or markdown docs describing API response shapes and Socket.IO payloads
- When shared types change, update the contracts — tvOS developers reference these when updating Swift models

### 3. API Versioning

With separate repos, the server and clients will evolve at different speeds. Prefix all API routes with `/api/v1/` to allow breaking changes in future versions without immediately breaking older app builds. This is especially important once the app is in the App Store and users may be on older versions.

### 4. Per-Repo Documentation

Each repo should have its own:
- `README.md` — setup, build, and run instructions for that component
- `CLAUDE.md` — AI assistant instructions scoped to that repo

The `ktv-singer-docs` repo covers the full system: architecture diagrams, how repos connect, API contracts, deployment topology, and the project roadmap.

### 5. Infrastructure (`ktv-singer-infra`)

Placeholder for when production deployment is ready. Will contain:
- Dockerfiles and docker-compose configs
- CI/CD pipeline definitions (GitHub Actions)
- Environment variable templates
- Deployment scripts (Railway, Render, etc.)
- Monitoring and logging configuration

## Migration Plan

1. Commit and merge all current work on the monorepo (`feat/tech-debt-and-features` → `main`)
2. Create repos on GitHub under `thirstypig` org
3. Split code using `git filter-branch` or `git subtree split` to preserve history per directory
4. Wire up `ktv-singer-shared` as a git dependency in server and app repos
5. Update path aliases and imports in each repo
6. Verify builds: `npm run check:server`, `npm run check` (mobile), `xcodebuild` (tvOS)
7. Archive the original `ktv-singer` monorepo (keep as read-only reference)
