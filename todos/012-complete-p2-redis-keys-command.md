---
status: complete
priority: p2
issue_id: "012"
tags: [code-review, performance, server]
dependencies: []
---

# Redis KEYS Command Blocks Event Loop

## Problem Statement

`RedisSessionStore.count()` uses `redis.keys()` which scans all keys and blocks the Redis server. This is documented as an O(N) operation that should never be used in production.

## Findings

- **File:** `ktv-singer-server/server/features/pairing/session-store.ts:108`
- **Evidence:** `const keys = await redis.keys(\`${REDIS_KEY_PREFIX}*\`);`

## Proposed Solutions

### Option A: Use SCAN with cursor-based iteration
- **Pros:** Non-blocking, production-safe
- **Cons:** Slightly more complex
- **Effort:** Small
- **Risk:** None

### Option B: Track count in a separate Redis key (INCR/DECR)
- **Pros:** O(1) count lookup
- **Cons:** Need to keep in sync with creates/deletes
- **Effort:** Small
- **Risk:** Low (counter drift)

## Recommended Action

Option B — maintain a counter key (`session:count`) incremented on create and decremented on delete.

## Technical Details

- **Affected files:** `ktv-singer-server/server/features/pairing/session-store.ts`

## Acceptance Criteria

- [ ] No `KEYS` command used in production code
- [ ] Session count is still accurate

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-13 | Identified during code review | KEYS blocks Redis |
