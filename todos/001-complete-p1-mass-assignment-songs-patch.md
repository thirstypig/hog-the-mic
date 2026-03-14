---
status: complete
priority: p1
issue_id: "001"
tags: [code-review, security, server]
dependencies: []
---

# Mass Assignment on PATCH /api/songs/:id

## Problem Statement

`req.body` is passed directly to `storage.updateSong()` with no validation or field filtering. An attacker can overwrite any column — `playCount`, `lalalJobId`, `instrumentalUrl`, `gaudioJobId`, etc. — by including them in the request body.

The POST endpoint correctly uses `insertSongSchema.parse(req.body)` via Zod, but PATCH has no validation at all.

## Findings

- **File:** `ktv-singer-server/server/features/songs/songs.routes.ts:58-69`
- **Evidence:** `const song = await storage.updateSong(req.params.id, req.body);`
- **Risk:** Any field on the songs table can be overwritten by any unauthenticated client

## Proposed Solutions

### Option A: Create a Zod schema for allowed PATCH fields
- **Pros:** Type-safe, explicit allowlist, consistent with POST pattern
- **Cons:** Need to define which fields are user-editable
- **Effort:** Small
- **Risk:** Low

### Option B: Manually pick allowed fields from req.body
- **Pros:** Simple, no new schema needed
- **Cons:** Easy to forget fields, not type-safe
- **Effort:** Small
- **Risk:** Low

## Recommended Action

Option A — create an `updateSongSchema` in shared that allows only: `title`, `artist`, `genre`, `gender`, `year`, `lyrics`, `lyricsOffset`, `thumbnailUrl`.

## Technical Details

- **Affected files:** `ktv-singer-server/server/features/songs/songs.routes.ts`
- **Affected components:** Songs API
- **Database changes:** None

## Acceptance Criteria

- [ ] PATCH /api/songs/:id validates request body against an allowlist schema
- [ ] Fields like `playCount`, `lalalJobId`, `instrumentalUrl` cannot be set via PATCH
- [ ] Existing PATCH functionality (lyrics, lyricsOffset) still works

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-13 | Identified during code review | POST uses Zod but PATCH does not |

## Resources

- `ktv-singer-server/server/features/songs/songs.routes.ts:58-69`
- `ktv-singer-shared/schema/songs.ts` (insertSongSchema definition)
