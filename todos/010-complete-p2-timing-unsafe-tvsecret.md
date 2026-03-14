---
status: complete
priority: p2
issue_id: "010"
tags: [code-review, security, server]
dependencies: []
---

# Timing-Unsafe tvSecret Comparison

## Problem Statement

The TV role authentication uses `!==` for secret comparison, which is vulnerable to timing attacks. An attacker could brute-force the tvSecret by measuring response times.

## Findings

- **File:** `ktv-singer-server/server/features/pairing/pairing.socket.ts:150`
- **Evidence:** `if (!tvSecret || tvSecret !== session.tvSecret)`

## Proposed Solutions

### Option A: Use crypto.timingSafeEqual()
- **Pros:** Constant-time comparison, standard practice
- **Cons:** Need to handle string→Buffer conversion
- **Effort:** Tiny
- **Risk:** None

## Technical Details

- **Affected files:** `ktv-singer-server/server/features/pairing/pairing.socket.ts`

## Acceptance Criteria

- [ ] tvSecret comparison uses timing-safe method
- [ ] TV pairing still works correctly

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-13 | Identified during code review | String !== is not timing-safe |
