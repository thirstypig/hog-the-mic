---
status: pending
priority: p2
issue_id: "026"
tags: [code-review, performance, server]
dependencies: []
---

# Unbounded yt-dlp Waiting Queue

## Problem Statement

The concurrency limiter waiting queue has no max length or timeout. With MAX_CONCURRENT=3 and 30s timeout per extraction, the 50th waiter would wait ~500 seconds. Disconnected HTTP clients still hold queue positions.

## Findings

- **File:** `ktv-singer-server/server/features/streaming/streaming.service.ts:28-45`
- **Agents:** Performance Oracle (Critical-2)

## Proposed Solution

Add MAX_QUEUE_LENGTH (20) and QUEUE_TIMEOUT_MS (60s). Return 503 when queue is full, 504 on timeout.

## Acceptance Criteria

- [ ] Queue has max length with 503 response when full
- [ ] Queue entries time out after 60s with 504 response
- [ ] Normal streaming unaffected

## Work Log

| Date | Action |
|------|--------|
| 2026-03-24 | Created from code review |
