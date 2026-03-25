---
status: pending
priority: p2
issue_id: "030"
tags: [code-review, architecture, simplification, server]
dependencies: []
---

# Remove Storage Abstraction Layer (~160 LOC)

## Problem Statement

IStorage interface + DatabaseStorage class in storage.ts is 160 lines of pure delegation boilerplate. Every method is a one-liner like `return songsStorage.getSong(id)`. The interface is never referenced outside its own file. playlist.routes.ts already bypasses it. Adds unnecessary indirection.

## Findings

- **File:** `ktv-singer-server/server/storage.ts` — 160 lines, zero added logic
- **Agents:** Architecture Strategist, Code Simplicity, Pattern Recognition

## Proposed Solution

Delete IStorage and DatabaseStorage. Have route files import directly from feature storage modules. ~105 LOC removed.

## Acceptance Criteria

- [ ] storage.ts deleted
- [ ] All route files import from feature storage modules directly
- [ ] No functionality changed
- [ ] `npm run check` passes

## Work Log

| Date | Action |
|------|--------|
| 2026-03-24 | Created from code review |
