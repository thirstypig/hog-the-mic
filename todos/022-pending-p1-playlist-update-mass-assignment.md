---
status: pending
priority: p1
issue_id: "022"
tags: [code-review, security, server]
dependencies: []
---

# Mass Assignment on Playlist Update — No Schema Validation

## Problem Statement

The playlist update route passes `req.body` directly to `storage.updatePlaylist()` with no validation. An attacker can overwrite `userId`, `id`, or `createdAt`. Same class of bug fixed for songs (todo 001) but never addressed for playlists.

## Findings

- **File:** `ktv-singer-server/server/features/playlist/playlist.routes.ts:73`
- **Evidence:** `const updated = await storage.updatePlaylist(req.params.id, req.body);`
- **Contrast:** Creation (line 25) correctly uses `insertPlaylistSchema.safeParse()`
- **Agents:** Security Sentinel (HIGH-03), Pattern Recognition (P1)

## Proposed Solution

Create `updatePlaylistSchema` in ktv-singer-shared (like `updateSongSchema`). Allowlist only `name` and `description` fields. Validate with `.parse(req.body)` before passing to storage.

## Acceptance Criteria

- [ ] `updatePlaylistSchema` created in shared package
- [ ] Playlist update route validates request body
- [ ] Only allowlisted fields can be updated

## Work Log

| Date | Action |
|------|--------|
| 2026-03-24 | Created from code review |
