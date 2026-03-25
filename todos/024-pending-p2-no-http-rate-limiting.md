---
status: pending
priority: p2
issue_id: "024"
tags: [code-review, security, performance, server]
dependencies: []
---

# No Rate Limiting on HTTP API Routes

## Problem Statement

Socket.IO has per-event rate limiting but HTTP API has none (except POST /api/pairing/sessions). Attackers can flood search routes (amplification via external APIs), streaming routes (exhaust yt-dlp slots), and vocal separation routes (run up LALAL.AI costs).

## Findings

- **Agents:** Security Sentinel (HIGH-04), Performance Oracle

## Proposed Solution

Add `express-rate-limit` middleware globally with stricter per-route limits on search, streaming, and vocal separation endpoints.

## Acceptance Criteria

- [ ] Global rate limit middleware installed
- [ ] Stricter limits on search, streaming, and vocal separation routes
- [ ] Rate limit headers returned to clients

## Work Log

| Date | Action |
|------|--------|
| 2026-03-24 | Created from code review |
