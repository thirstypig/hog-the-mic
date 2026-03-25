---
status: pending
priority: p3
issue_id: "033"
tags: [code-review, security, server]
dependencies: []
---

# Error Messages Leak Internal Details

## Problem Statement

Several error handlers forward raw `error.message` to client responses. Internal details from axios, database drivers, or yt-dlp can leak file paths, internal URLs, or configuration.

## Findings

- **File:** `ktv-singer-server/server/features/vocal-separation/vocal-separation.routes.ts:54`
- **File:** `ktv-singer-server/server/features/vocal-separation/lalalai.service.ts:100`
- **File:** `ktv-singer-server/server/features/streaming/streaming.routes.ts:28-29`
- **Agents:** Security Sentinel (MEDIUM-02)

## Proposed Solution

In production, return generic error messages to clients. Log detailed errors server-side only.

## Acceptance Criteria

- [ ] No raw error.message sent to clients in production
- [ ] Detailed errors still logged server-side

## Work Log

| Date | Action |
|------|--------|
| 2026-03-24 | Created from code review |
