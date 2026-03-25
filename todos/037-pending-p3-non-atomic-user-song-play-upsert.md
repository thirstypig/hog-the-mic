---
status: pending
priority: p3
issue_id: "037"
tags: [code-review, performance, database, server]
dependencies: []
---

# Non-Atomic incrementUserSongPlay — Duplicate Row Risk

## Problem Statement

Uses update-then-insert pattern. Two concurrent requests for same user+song can both see 0 rows updated and both INSERT, creating duplicates (no unique constraint on user_id+song_id).

## Findings

- **File:** `ktv-singer-server/server/features/scoring/plays.storage.ts:5-26`
- **Agents:** Performance Oracle (LOW-10)

## Proposed Solution

Add unique composite index on (userId, songId) in schema and use Drizzle's `onConflictDoUpdate`.

## Acceptance Criteria

- [ ] Unique constraint added to user_song_plays.(user_id, song_id)
- [ ] Upsert uses onConflictDoUpdate
- [ ] No duplicate rows possible

## Work Log

| Date | Action |
|------|--------|
| 2026-03-24 | Created from code review |
