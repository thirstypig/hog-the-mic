---
status: complete
priority: p2
issue_id: "008"
tags: [code-review, security, server]
dependencies: []
---

# SESSION_SECRET Non-null Assertion Crashes if Unset

## Problem Statement

`getSession()` uses `process.env.SESSION_SECRET!` with a non-null assertion. The `setupAuth()` function checks for OIDC env vars but does not check `SESSION_SECRET`. If OIDC is configured but `SESSION_SECRET` is missing, the session middleware will use `undefined` as the secret, which may produce invalid signatures or crash.

## Findings

- **File:** `ktv-singer-server/server/features/auth/auth.setup.ts:42`
- **Evidence:** `secret: process.env.SESSION_SECRET!`
- **File:** `ktv-singer-server/server/features/auth/auth.setup.ts:82`
- **Evidence:** Only checks `issuerUrl`, `clientId`, `clientSecret`, `appUrl`

## Proposed Solutions

### Option A: Add SESSION_SECRET to the env var check in setupAuth
- **Pros:** Simple, consistent with existing pattern
- **Cons:** None
- **Effort:** Tiny
- **Risk:** None

## Technical Details

- **Affected files:** `ktv-singer-server/server/features/auth/auth.setup.ts`

## Acceptance Criteria

- [ ] `SESSION_SECRET` is validated before use
- [ ] Clear error message if missing

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-13 | Identified during code review | Non-null assertion hides missing env var |
