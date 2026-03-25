---
status: pending
priority: p3
issue_id: "036"
tags: [code-review, performance, server]
dependencies: []
---

# Sequential Invidious Fallback — 30s Worst Case

## Problem Statement

When YouTube API key is not set, search falls through 4 Invidious instances sequentially (5s timeout each) then HTML scraping (10s). Worst case: 30 seconds.

## Findings

- **File:** `ktv-singer-server/server/features/search/search.routes.ts:21-87`
- **Agents:** Performance Oracle (MEDIUM-8)

## Proposed Solution

Race instances in parallel with `Promise.any()`. Fall back to scraping only if all fail. Reduces worst-case from 20s to 5s.

## Acceptance Criteria

- [ ] Invidious instances queried in parallel
- [ ] First success returned immediately
- [ ] Scraping fallback preserved if all fail

## Work Log

| Date | Action |
|------|--------|
| 2026-03-24 | Created from code review |
