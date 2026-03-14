---
status: complete
priority: p2
issue_id: "014"
tags: [code-review, security, server]
dependencies: []
---

# Passport Serializes Full User Object Including Tokens

## Problem Statement

`passport.serializeUser` stores the entire user object (including `access_token`, `refresh_token`, and OIDC claims) in the session. This means tokens are persisted in the session store (PostgreSQL or in-memory), increasing storage and exposure risk.

## Findings

- **File:** `ktv-singer-server/server/features/auth/auth.setup.ts:114-115`
- **Evidence:**
  ```typescript
  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));
  ```

## Proposed Solutions

### Option A: Serialize only user ID, look up on deserialize
- **Pros:** Minimal session data, tokens not persisted in session store
- **Cons:** Extra DB query on each request
- **Effort:** Small
- **Risk:** Low

### Option B: Serialize user ID + tokens (but not full claims)
- **Pros:** Avoids DB query, keeps token refresh working
- **Cons:** Tokens still in session store
- **Effort:** Small
- **Risk:** Low

## Recommended Action

Option B — serialize `{ id, access_token, refresh_token, expires_at }` only.

## Technical Details

- **Affected files:** `ktv-singer-server/server/features/auth/auth.setup.ts`

## Acceptance Criteria

- [ ] Only necessary fields stored in session
- [ ] Token refresh still works
- [ ] Auth middleware still functions

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-13 | Identified during code review | Full user object with tokens in session |
