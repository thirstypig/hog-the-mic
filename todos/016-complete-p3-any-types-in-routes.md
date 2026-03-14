---
status: complete
priority: p3
issue_id: "016"
tags: [code-review, quality, server]
dependencies: []
---

# Widespread `any` Types in Route Handlers

## Problem Statement

Playlist routes and other handlers use `req: any` casts, bypassing TypeScript's type safety. Error catches also use `error: any` throughout.

## Findings

- **File:** `ktv-singer-server/server/features/playlist/playlist.routes.ts` — `req: any` on every handler
- **File:** Multiple routes — `catch (error: any)` pattern
- **Impact:** TypeScript won't catch property access errors on `req.user`

## Proposed Solutions

### Option A: Extend Express Request type with user claims
- **Effort:** Small
- **Risk:** None

## Technical Details

- **Affected files:** All route files in `ktv-singer-server/server/features/`

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-13 | Identified during code review | any bypasses TS safety |
