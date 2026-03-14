---
status: complete
priority: p3
issue_id: "015"
tags: [code-review, app, tech-debt]
dependencies: []
---

# Hardcoded Development IP Address

## Problem Statement

The mobile app has a hardcoded LAN IP `192.168.4.23:4040` as the default dev API URL. This is already tracked in the roadmap as tech debt.

## Findings

- **File:** `ktv-singer-app/src/common/lib/api.ts:12`
- **Evidence:** `let _baseUrl = __DEV__ ? "http://192.168.4.23:4040" : "http://localhost:4040";`

## Proposed Solutions

### Option A: Use Expo config plugin / app.config.ts for API URL
- **Effort:** Small
- **Risk:** None

## Technical Details

- **Affected files:** `ktv-singer-app/src/common/lib/api.ts`

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-13 | Identified during code review | Already in roadmap |
