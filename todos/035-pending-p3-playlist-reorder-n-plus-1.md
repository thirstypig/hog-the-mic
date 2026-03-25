---
status: pending
priority: p3
issue_id: "035"
tags: [code-review, performance, server]
dependencies: []
---

# N+1 Query in Playlist Reordering

## Problem Statement

`reorderPlaylistSongs()` issues one UPDATE per song sequentially. A 20-song playlist fires 20 database round trips.

## Findings

- **File:** `ktv-singer-server/server/features/playlist/playlist.storage.ts:72-85`
- **Agents:** Performance Oracle (MEDIUM-4)

## Proposed Solution

Wrap in a transaction and use Promise.all for concurrent updates.

## Acceptance Criteria

- [ ] Reorder wrapped in transaction
- [ ] Updates run concurrently within transaction

## Work Log

| Date | Action |
|------|--------|
| 2026-03-24 | Created from code review |
