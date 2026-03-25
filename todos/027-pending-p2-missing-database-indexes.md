---
status: pending
priority: p2
issue_id: "027"
tags: [code-review, performance, database, shared]
dependencies: []
---

# Missing Database Indexes on Foreign Key Columns

## Problem Statement

PostgreSQL does not auto-create indexes on FK columns. Multiple columns queried with WHERE clauses currently perform sequential table scans.

## Findings

- **Missing indexes:** performances.(song_id, user_id), user_song_plays.(user_id, song_id), playlists.user_id, playlist_songs.(playlist_id, song_id)
- **Files:** `ktv-singer-shared/schema/performances.ts`, `plays.ts`, `playlists.ts`
- **Agents:** Performance Oracle (Critical-3)

## Proposed Solution

Add indexes in Drizzle schema files using the table callback pattern, then run `npm run db:push`.

## Acceptance Criteria

- [ ] Indexes added to all FK columns queried with WHERE
- [ ] Composite index on user_song_plays.(user_id, song_id)
- [ ] Composite index on playlist_songs.(playlist_id, song_id)
- [ ] Schema pushed to database

## Work Log

| Date | Action |
|------|--------|
| 2026-03-24 | Created from code review |
