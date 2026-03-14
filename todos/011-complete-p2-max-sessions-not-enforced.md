---
status: complete
priority: p2
issue_id: "011"
tags: [code-review, security, server]
dependencies: []
---

# MAX_SESSIONS Declared but Never Enforced

## Problem Statement

`MAX_SESSIONS = 100` is defined in `session-store.ts` but never checked when creating sessions. An attacker could create unlimited sessions, consuming server memory (in-memory store) or Redis storage.

## Findings

- **File:** `ktv-singer-server/server/features/pairing/session-store.ts:17-18`
- **Evidence:** `const MAX_SESSIONS = 100;` — unused constant

## Proposed Solutions

### Option A: Check count in create() and reject if at limit
- **Pros:** Simple, uses existing constant
- **Cons:** None
- **Effort:** Tiny
- **Risk:** None

## Technical Details

- **Affected files:** `ktv-singer-server/server/features/pairing/session-store.ts`

## Acceptance Criteria

- [ ] Session creation fails with a clear error when MAX_SESSIONS is reached
- [ ] Both InMemory and Redis stores enforce the limit

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-13 | Identified during code review | Dead constant, no enforcement |
