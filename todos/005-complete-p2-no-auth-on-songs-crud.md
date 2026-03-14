---
status: complete
priority: p2
issue_id: "005"
tags: [code-review, security, server]
dependencies: []
---

# No Authentication on Songs CRUD, Streaming, Vocal Separation, and Pairing

## Problem Statement

Songs CRUD, YouTube search/streaming, vocal separation, and pairing endpoints are all unauthenticated. Anyone on the network can create, modify, or delete songs and trigger vocal separation jobs (which consume paid API credits).

Playlist routes correctly use `isAuthenticated` middleware, but other feature routes do not.

## Findings

- **File:** `ktv-singer-server/server/features/songs/songs.routes.ts` — no auth middleware
- **File:** `ktv-singer-server/server/features/streaming/streaming.routes.ts` — no auth middleware
- **File:** `ktv-singer-server/server/features/vocal-separation/vocal-separation.routes.ts` — no auth middleware
- **File:** `ktv-singer-server/server/features/search/search.routes.ts` — no auth middleware

## Proposed Solutions

### Option A: Add isAuthenticated to all mutating endpoints
- **Pros:** Protects write operations, search/read stays open for guest UX
- **Cons:** Breaks unauthenticated flows if auth isn't configured
- **Effort:** Small
- **Risk:** Medium (need to handle auth-optional dev mode)

### Option B: Add optional auth middleware that allows requests when OIDC is not configured
- **Pros:** Keeps dev experience smooth, protects prod
- **Cons:** More nuanced implementation
- **Effort:** Medium
- **Risk:** Low

## Recommended Action

Option B — create an `isAuthenticatedIfConfigured` middleware that passes through when OIDC env vars aren't set but enforces auth when they are. Apply to mutating endpoints (POST, PATCH, DELETE) and vocal separation (paid API).

## Technical Details

- **Affected files:** All route files in `ktv-singer-server/server/features/`
- **Affected components:** Songs, Streaming, Vocal Separation, Search APIs

## Acceptance Criteria

- [ ] Mutating song endpoints require auth when OIDC is configured
- [ ] Vocal separation endpoints require auth (to protect paid API credits)
- [ ] Read/search endpoints remain accessible without auth
- [ ] Dev mode without OIDC still works

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-13 | Identified during code review | Only playlist routes use isAuthenticated |
