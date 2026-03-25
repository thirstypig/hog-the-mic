---
status: pending
priority: p3
issue_id: "032"
tags: [code-review, security, server]
dependencies: []
---

# Missing Security Headers

## Problem Statement

No CSP, X-Content-Type-Options, X-Frame-Options, HSTS, or Referrer-Policy headers. Server serves Vite frontend in production via serveStatic, making these important.

## Findings

- **File:** `ktv-singer-server/server/index.ts` — no security headers middleware
- **Agents:** Security Sentinel (MEDIUM-03)

## Proposed Solution

Add the `helmet` npm package as middleware.

## Acceptance Criteria

- [ ] `helmet` installed and configured
- [ ] Security headers present on all responses

## Work Log

| Date | Action |
|------|--------|
| 2026-03-24 | Created from code review |
