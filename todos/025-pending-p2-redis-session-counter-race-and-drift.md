---
status: pending
priority: p2
issue_id: "025"
tags: [code-review, performance, server]
dependencies: []
---

# Redis Session Counter Race Condition and TTL Drift

## Problem Statement

RedisSessionStore uses non-atomic read-check-write for MAX_SESSIONS limit. Race condition allows exceeding limit. Sessions that expire via Redis TTL never decrement the counter, causing permanent upward drift — eventually blocking all new sessions.

## Findings

- **File:** `ktv-singer-server/server/features/pairing/session-store.ts:82-93` — non-atomic create
- **File:** `ktv-singer-server/server/features/pairing/session-store.ts:108-115` — decrement on delete only
- **Agents:** Security Sentinel (MEDIUM-01), Performance Oracle (Critical-1)

## Proposed Solution

Remove the manual counter. Use `SCAN` with key prefix to count live session keys (fine at MAX_SESSIONS=100). Delete the `REDIS_COUNT_KEY` approach entirely.

## Acceptance Criteria

- [ ] Manual counter removed
- [ ] Session count derived from actual Redis keys
- [ ] TTL-expired sessions no longer cause drift
- [ ] MAX_SESSIONS limit still enforced

## Work Log

| Date | Action |
|------|--------|
| 2026-03-24 | Created from code review |
