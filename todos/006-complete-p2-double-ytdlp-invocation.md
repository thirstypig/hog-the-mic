---
status: complete
priority: p2
issue_id: "006"
tags: [code-review, performance, server]
dependencies: []
---

# Double yt-dlp Invocation per Stream Extraction

## Problem Statement

`extractStream()` calls `yt-dlp` twice per video — once with `--get-url` to get the stream URL, then again with `--dump-json` to get format info for logging. Each invocation takes 5-30 seconds and spawns a child process. This doubles extraction time unnecessarily.

## Findings

- **File:** `ktv-singer-server/server/features/streaming/streaming.service.ts:140-190`
- **Evidence:** Two `execFileAsync("yt-dlp", ...)` calls — line 144 and line 165
- **Impact:** With max 3 concurrent extractions, this halves effective throughput

## Proposed Solutions

### Option A: Use --dump-json only and extract URL from JSON output
- **Pros:** Single invocation, gets both URL and format info
- **Cons:** Need to parse the `url` field from JSON
- **Effort:** Small
- **Risk:** Low

## Recommended Action

Option A — use `--dump-json` and extract `info.url` from the response. The JSON includes the stream URL, format, resolution, codecs, and all metadata in one call.

## Technical Details

- **Affected files:** `ktv-singer-server/server/features/streaming/streaming.service.ts`

## Acceptance Criteria

- [ ] Only one yt-dlp invocation per stream extraction
- [ ] Stream URL and quality info both extracted from single call
- [ ] Caching and retry logic still works

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-13 | Identified during code review | Two yt-dlp calls per extraction |
