---
status: pending
priority: p3
issue_id: "034"
tags: [code-review, quality, simplification, server]
dependencies: []
---

# Admin Page Layout Duplication (~800-1000 LOC)

## Problem Statement

5 admin route files each contain ~200 lines of identical sidebar HTML, CSS custom properties, responsive styles, and JavaScript. SidebarLink interface defined 5 times. LAST_UPDATED defined 5 times.

## Findings

- **Files:** `ktv-singer-server/server/features/tech/*.routes.ts` (all 5)
- **Agents:** Code Simplicity, Pattern Recognition

## Proposed Solution

Extract shared sidebar, CSS, and layout into `server/features/tech/shared-layout.ts` with a `wrapInAdminPage(title, content)` helper.

## Acceptance Criteria

- [ ] Shared layout module created
- [ ] All 5 admin pages use shared module
- [ ] ~800+ LOC of duplication removed
- [ ] Visual appearance unchanged

## Work Log

| Date | Action |
|------|--------|
| 2026-03-24 | Created from code review |
