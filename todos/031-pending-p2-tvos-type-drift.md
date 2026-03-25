---
status: pending
priority: p2
issue_id: "031"
tags: [code-review, architecture, tvos]
dependencies: []
---

# tvOS Type Drift from TypeScript Shared Definitions

## Problem Statement

tvOS Swift models are manually maintained with no link to the shared TypeScript type definitions. QueueEntry.swift is missing `addedBySocketId`. Song.swift may have field mismatches. Any new server-side required field will cause decoding failures on tvOS since it uses `convertFromSnakeCase`.

## Findings

- **File:** `ktv-singer-tvos/Shared/Models/QueueEntry.swift` — missing addedBySocketId
- **File:** `ktv-singer-tvos/Shared/Models/Song.swift` — potential field drift
- **Agents:** Architecture Strategist (HIGH RISK)

## Proposed Solution

Options: (a) codegen script that outputs Swift Codable structs from Drizzle schema, (b) OpenAPI intermediate representation, or (c) make all new fields optional in Swift with explicit CodingKeys. Short-term, option (c) is simplest.

## Acceptance Criteria

- [ ] Swift models updated to match current TypeScript definitions
- [ ] All non-essential fields marked optional in Swift
- [ ] Strategy chosen for ongoing sync

## Work Log

| Date | Action |
|------|--------|
| 2026-03-24 | Created from code review |
