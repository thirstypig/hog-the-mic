# CLAUDE.md — KTV Singer (Monorepo Root)

## Project Overview

YouTube-powered karaoke system split into 7 independent project folders. Each folder is self-contained and independently buildable.

## Repository Layout

```
ktv-singer/
├── ktv-singer-shared/    ← Drizzle schemas, Socket.IO type contracts
├── ktv-singer-server/    ← Express REST API + Socket.IO
├── ktv-singer-app/       ← Expo React Native (iOS, Android, web)
├── ktv-singer-tvos/      ← Native tvOS app (SwiftUI, AVPlayer)
├── ktv-singer-docs/      ← Documentation, roadmap, design guidelines
├── ktv-singer-infra/     ← Docker, CI/CD configuration
└── ktv-singer-web/       ← Placeholder for future web client
```

## Quick Start

```bash
# 1. Install shared package (no npm install needed — peer deps only)
# 2. Start the server
cd ktv-singer-server && npm install && npm run dev

# 3. Start the mobile app (separate terminal)
cd ktv-singer-app && npm install && npm start
```

## Build & Verify

```bash
# Server type check
cd ktv-singer-server && npm run check

# Mobile type check
cd ktv-singer-app && npm run check

# tvOS project generation
cd ktv-singer-tvos && xcodegen generate
```

## Shared Package Linking

Sub-repos reference `ktv-singer-shared` via `"file:../ktv-singer-shared"` in their package.json. npm creates a symlink. Both server and app use `"preserveSymlinks": true` in tsconfig to ensure TypeScript resolves dependencies from the consumer's node_modules.

## Rules

- Each sub-repo has its own CLAUDE.md with specific rules — read those for per-project guidance
- `ktv-singer-shared` uses peerDependencies — consumers must provide drizzle-orm, drizzle-zod, postgres, zod
- Do not install new dependencies without asking
- Feature modules are isolated — no cross-feature imports
- Port 4040 for Express API + Socket.IO
