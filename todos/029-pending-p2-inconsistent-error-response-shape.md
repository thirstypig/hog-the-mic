---
status: pending
priority: p2
issue_id: "029"
tags: [code-review, quality, server]
dependencies: []
---

# Inconsistent Error Response Shape

## Problem Statement

Error responses use two different key names: most routes use `{ error: "message" }` but auth/middleware routes use `{ message: "message" }`. Clients must handle both.

## Findings

- **`{ error }` pattern:** search, songs, streaming, vocal-separation, playlist, plays routes
- **`{ message }` pattern:** auth.routes.ts:14, auth.middleware.ts:28/38/48, pairing.routes.ts:33/40/65
- **Agents:** Pattern Recognition (MEDIUM)

## Proposed Solution

Standardize on `{ error: string }` across all routes. Update auth middleware and pairing routes.

## Acceptance Criteria

- [ ] All error responses use `{ error: string }` format
- [ ] Client code updated if needed

## Work Log

| Date | Action |
|------|--------|
| 2026-03-24 | Created from code review |
