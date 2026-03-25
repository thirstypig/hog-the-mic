---
status: pending
priority: p2
issue_id: "023"
tags: [code-review, security, server]
dependencies: []
---

# Missing Auth on Lyrics-Offset, Performances, and Play Count Routes

## Problem Statement

Several data-mutating routes have no authentication middleware: PATCH /api/songs/:id/lyrics-offset, POST /api/performances, POST /api/songs/:id/play. Anyone can modify lyrics offsets, submit fake performance scores, or inflate play counts.

## Findings

- **File:** `ktv-singer-server/server/features/songs/songs.routes.ts:77` — lyrics-offset, no auth
- **File:** `ktv-singer-server/server/features/scoring/scoring.routes.ts:9` — performances, no auth
- **File:** `ktv-singer-server/server/features/scoring/plays.routes.ts:20` — play count, no auth
- **Agents:** Security Sentinel (HIGH-01)

## Proposed Solution

Add `requireAuthIfConfigured` middleware to all three routes.

## Acceptance Criteria

- [ ] `requireAuthIfConfigured` added to lyrics-offset, performances, and play count routes
- [ ] Routes still work in dev without auth configured

## Work Log

| Date | Action |
|------|--------|
| 2026-03-24 | Created from code review |
