---
status: complete
priority: p3
issue_id: "018"
tags: [code-review, architecture]
dependencies: []
---

# Model Duplication Across Repos (Shared, App, tvOS)

## Problem Statement

`Song`, `QueueEntry`, and related models are independently defined in three places:
- `ktv-singer-shared` — Drizzle schemas (source of truth for DB)
- `ktv-singer-app` — TypeScript interfaces in hooks/types
- `ktv-singer-tvos` — Swift structs in Models/

There is no code generation or automated sync. Field mismatches between repos will cause silent data loss or runtime errors.

## Findings

- **File:** `ktv-singer-shared/schema/songs.ts` — Drizzle Song schema
- **File:** `ktv-singer-tvos/Shared/Models/Song.swift` — Swift Song struct
- **File:** `ktv-singer-tvos/Shared/Models/QueueEntry.swift` — Swift QueueEntry struct
- **File:** `ktv-singer-shared/pairing/pairing.types.ts` — TS QueueEntry type

## Proposed Solutions

### Option A: Generate Swift models from TypeScript types
- **Pros:** Single source of truth, automated sync
- **Cons:** Tooling setup required (e.g., quicktype, custom codegen)
- **Effort:** Medium
- **Risk:** Low

### Option B: Manual sync with a checklist
- **Pros:** No tooling needed
- **Cons:** Human error, will drift
- **Effort:** Tiny
- **Risk:** Medium

## Recommended Action

Option A long-term, Option B for now.

## Technical Details

- **Affected repos:** ktv-singer-shared, ktv-singer-app, ktv-singer-tvos

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-13 | Identified during code review | Three independent model definitions |
