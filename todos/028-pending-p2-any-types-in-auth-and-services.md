---
status: pending
priority: p2
issue_id: "028"
tags: [code-review, typescript, server]
dependencies: []
---

# Eliminate `any` Types in Auth Layer and Services

## Problem Statement

Multiple `any` escape hatches when proper types already exist. Defeats TypeScript's value.

## Findings

- **auth.setup.ts:55,64,118,126** — `any` when AuthenticatedUser/OidcClaims types exist
- **pairing.socket.ts:155** — `(payload as any).tvSecret` — needs discriminated union in shared types
- **lalalai.service.ts:98,132,165** — `catch (error: any)` when AxiosError available
- **streaming.service.ts:158,191** — untyped JSON.parse, `catch (error: any)`
- **search.routes.ts:9,37** — `req.query.q as string`, `any[]` for Invidious response
- **Agents:** TypeScript Reviewer (CRITICAL 1-4, HIGH 5-7)

## Proposed Solution

Replace all `any` with proper types. Create discriminated union for join_session payload. Define interfaces for Invidious and yt-dlp responses. Use AxiosError for catch blocks.

## Acceptance Criteria

- [ ] Zero `any` types in auth.setup.ts
- [ ] join_session payload uses discriminated union with tvSecret
- [ ] External API responses have typed interfaces
- [ ] `catch (error: unknown)` with proper narrowing

## Work Log

| Date | Action |
|------|--------|
| 2026-03-24 | Created from code review |
