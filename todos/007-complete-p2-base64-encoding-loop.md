---
status: complete
priority: p2
issue_id: "007"
tags: [code-review, performance, app]
dependencies: []
---

# Base64 Audio Encoding via O(n²) String Concatenation Loop

## Problem Statement

The microphone hook converts audio chunks to base64 using a character-by-character string concatenation loop. String concatenation in a loop is O(n²) in JavaScript. This runs 4 times per second during streaming, creating unnecessary CPU pressure and potential audio latency.

## Findings

- **File:** `ktv-singer-app/src/features/mic/hooks/useMicrophone.ts:96-100`
- **Evidence:**
  ```typescript
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  ```
- **Impact:** Audio chunks at 16kHz mono 16-bit = ~8KB per 250ms chunk. The loop creates ~8000 intermediate strings per chunk.

## Proposed Solutions

### Option A: Use a proper base64 encoding utility
- **Pros:** O(n) performance, battle-tested
- **Cons:** May need a polyfill depending on RN version
- **Effort:** Small
- **Risk:** Low

Example: `const base64 = Buffer.from(arrayBuffer).toString('base64')` or use `expo-file-system`'s `readAsStringAsync` with base64 encoding.

## Recommended Action

Option A — use the expo-file-system `readAsStringAsync(uri, { encoding: 'base64' })` which reads directly as base64 without the intermediate conversion.

## Technical Details

- **Affected files:** `ktv-singer-app/src/features/mic/hooks/useMicrophone.ts`

## Acceptance Criteria

- [ ] Audio chunks are base64-encoded without character-by-character loop
- [ ] Mic streaming still works correctly with tvOS AudioStreamService
- [ ] No noticeable audio latency increase

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-13 | Identified during code review | String concat in loop is O(n²) |
