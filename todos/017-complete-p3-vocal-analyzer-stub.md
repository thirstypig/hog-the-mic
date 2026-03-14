---
status: complete
priority: p3
issue_id: "017"
tags: [code-review, app, feature]
dependencies: []
---

# VocalAnalyzer is a Stub — Scoring Returns Placeholder Values

## Problem Statement

The scoring feature's `VocalAnalyzer` class returns hardcoded placeholder values (pitch=50, rhythm=50). The scoring UI exists but the actual audio analysis is not implemented.

## Findings

- **File:** `ktv-singer-app/src/features/scoring/utils/audioAnalyzer.ts`
- **Impact:** Scoring feature is non-functional, users see fake scores

## Proposed Solutions

### Option A: Implement real pitch detection using expo-audio or Web Audio API
- **Effort:** Large
- **Risk:** Medium

### Option B: Remove scoring UI until implementation is ready
- **Effort:** Small
- **Risk:** None

## Technical Details

- **Affected files:** `ktv-singer-app/src/features/scoring/`

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-13 | Identified during code review | Stub implementation |
