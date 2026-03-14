---
status: complete
priority: p2
issue_id: "009"
tags: [code-review, server]
dependencies: []
---

# Session Cookie secure:true Blocks HTTP in Development

## Problem Statement

The session cookie is always set with `secure: true`, which means browsers will only send it over HTTPS. In development over `http://localhost:4040`, session cookies will be silently dropped and auth will not work.

## Findings

- **File:** `ktv-singer-server/server/features/auth/auth.setup.ts:49`
- **Evidence:** `secure: true` — hardcoded regardless of environment

## Proposed Solutions

### Option A: Set secure based on NODE_ENV
- **Pros:** Simple, standard pattern
- **Cons:** None
- **Effort:** Tiny
- **Risk:** None

```typescript
secure: process.env.NODE_ENV === "production",
```

## Technical Details

- **Affected files:** `ktv-singer-server/server/features/auth/auth.setup.ts`

## Acceptance Criteria

- [ ] Cookies work over HTTP in development
- [ ] Cookies remain secure in production

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-13 | Identified during code review | secure:true + http = silent cookie drop |
