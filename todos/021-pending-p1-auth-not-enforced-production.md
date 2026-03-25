---
status: pending
priority: p1
issue_id: "021"
tags: [code-review, security, server]
dependencies: []
---

# Authentication Entirely Optional — No Production Enforcement

## Problem Statement

When OIDC env vars are not set, `setupAuth()` returns early and `requireAuthIfConfigured` passes through all requests. No check enforces OIDC in production, so a misconfigured deploy exposes all mutating routes to anonymous access — including vocal separation endpoints that cost money (LALAL.AI API).

## Findings

- **File:** `ktv-singer-server/server/middleware/auth.middleware.ts:17-19`
- **File:** `ktv-singer-server/server/features/auth/auth.setup.ts:82-85`
- **Agents:** Security Sentinel (CRITICAL-03)

## Proposed Solution

If `NODE_ENV=production` and OIDC vars are missing, throw and refuse to start. For cost-incurring routes (vocal separation), always require auth regardless of environment.

## Acceptance Criteria

- [ ] Server refuses to start in production without OIDC configuration
- [ ] Vocal separation routes always require authentication
- [ ] Dev mode still works without auth

## Work Log

| Date | Action |
|------|--------|
| 2026-03-24 | Created from code review |
