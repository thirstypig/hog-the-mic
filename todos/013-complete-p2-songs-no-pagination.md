---
status: complete
priority: p2
issue_id: "013"
tags: [code-review, performance, server]
dependencies: []
---

# GET /api/songs Returns All Songs with No Pagination

## Problem Statement

`GET /api/songs` calls `storage.getAllSongs()` which returns every song in the database. As the library grows, this will become slow and consume excessive memory/bandwidth.

## Findings

- **File:** `ktv-singer-server/server/features/songs/songs.routes.ts:7-15`
- **Evidence:** `const songs = await storage.getAllSongs();`
- **Impact:** Transfers all songs (including full lyrics JSONB) in one response

## Proposed Solutions

### Option A: Add limit/offset pagination
- **Pros:** Standard REST pattern, limits response size
- **Cons:** Need to update all clients
- **Effort:** Medium
- **Risk:** Low

### Option B: Add cursor-based pagination
- **Pros:** More efficient for large datasets
- **Cons:** More complex client changes
- **Effort:** Medium
- **Risk:** Low

## Recommended Action

Option A with a reasonable default limit (e.g., 50). Return total count in response headers for client pagination.

## Technical Details

- **Affected files:** `ktv-singer-server/server/features/songs/songs.routes.ts`, `songs.storage.ts`, app and tvOS clients

## Acceptance Criteria

- [ ] GET /api/songs supports `?limit=N&offset=N` query params
- [ ] Default limit is applied when none specified
- [ ] Clients updated to handle paginated responses

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-13 | Identified during code review | All songs fetched with full lyrics |
