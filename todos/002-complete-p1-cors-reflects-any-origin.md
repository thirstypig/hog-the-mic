---
status: complete
priority: p1
issue_id: "002"
tags: [code-review, security, server]
dependencies: []
---

# Permissive CORS Reflects Any Origin with Credentials

## Problem Statement

The server reflects whatever `Origin` header the browser sends and sets `Access-Control-Allow-Credentials: true`. This means any website can make authenticated cross-origin requests to the API. Socket.IO also uses `origin: "*"`.

For a LAN-only app this is low-risk, but becomes critical if ever exposed to the internet.

## Findings

- **File:** `ktv-singer-server/server/index.ts:10-14`
- **Evidence:**
  ```typescript
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  ```
- **File:** `ktv-singer-server/server/features/pairing/pairing.socket.ts:96`
- **Evidence:** `cors: { origin: "*", methods: ["GET", "POST"] }`

## Proposed Solutions

### Option A: Allowlist known origins
- **Pros:** Secure, standard practice
- **Cons:** Need to maintain list, harder for dev flexibility
- **Effort:** Small
- **Risk:** Low

### Option B: Use environment variable for allowed origins
- **Pros:** Configurable per environment, secure in prod
- **Cons:** Extra config step
- **Effort:** Small
- **Risk:** Low

## Recommended Action

Option B — use `CORS_ORIGINS` env var (comma-separated). Default to `*` in dev, require explicit origins in production.

## Technical Details

- **Affected files:** `ktv-singer-server/server/index.ts`, `ktv-singer-server/server/features/pairing/pairing.socket.ts`
- **Affected components:** Express CORS middleware, Socket.IO CORS

## Acceptance Criteria

- [ ] CORS origin is configurable via environment variable
- [ ] Production deployments require explicit origin allowlist
- [ ] Socket.IO CORS matches Express CORS configuration
- [ ] Dev mode still works without extra config

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-13 | Identified during code review | Both Express and Socket.IO have open CORS |

## Resources

- `ktv-singer-server/server/index.ts:10-23`
- `ktv-singer-server/server/features/pairing/pairing.socket.ts:93-99`
