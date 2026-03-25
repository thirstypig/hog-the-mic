---
status: pending
priority: p1
issue_id: "020"
tags: [code-review, security, server]
dependencies: []
---

# CORS Allows All Origins When CORS_ORIGINS Not Set

## Problem Statement

When `CORS_ORIGINS` env var is not set, Express CORS allows all origins with credentials, and Socket.IO CORS is set to `"*"`. Nothing enforces this in production. CORS parsing is also duplicated in two places with divergent fallback behavior.

## Findings

- **File:** `ktv-singer-server/server/index.ts:11-13` — Express CORS fallback to null (allow all)
- **File:** `ktv-singer-server/server/features/pairing/pairing.socket.ts:97-99` — Socket.IO fallback to "*"
- **Agents:** Security Sentinel (CRITICAL-02), Pattern Recognition (HIGH)

## Proposed Solution

Extract shared `getAllowedOrigins()` utility used by both Express and Socket.IO. In production (`NODE_ENV=production`), refuse to start if `CORS_ORIGINS` not set.

## Acceptance Criteria

- [ ] CORS origin parsing extracted to shared utility
- [ ] Both Express and Socket.IO use same utility
- [ ] Server refuses to start in production without CORS_ORIGINS
- [ ] Dev mode still works without CORS_ORIGINS

## Work Log

| Date | Action |
|------|--------|
| 2026-03-24 | Created from code review |
