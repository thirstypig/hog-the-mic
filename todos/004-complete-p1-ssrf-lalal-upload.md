---
status: complete
priority: p1
issue_id: "004"
tags: [code-review, security, server]
dependencies: []
---

# SSRF via LALAL.AI Upload — Unrestricted URL Fetch

## Problem Statement

`LalalAIService.uploadAudioFromUrl()` fetches any URL via `axios.get()` with `maxBodyLength: Infinity`. While the URL is currently constructed from `song.videoId` (YouTube), the function itself accepts arbitrary URLs. Combined with the mass assignment vulnerability (#001), an attacker could set a crafted `videoId` and trigger the server to download arbitrarily large files or hit internal network services.

## Findings

- **File:** `ktv-singer-server/server/features/vocal-separation/lalalai.service.ts:63-66`
- **Evidence:**
  ```typescript
  const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
  ```
  With `maxBodyLength: Infinity` and `maxContentLength: Infinity` on the upload.
- **File:** `ktv-singer-server/server/features/vocal-separation/vocal-separation.routes.ts:33`
- **Evidence:** URL constructed as `https://www.youtube.com/watch?v=${song.videoId}` — but videoId could be tampered via mass assignment

## Proposed Solutions

### Option A: Validate videoId format before constructing URL
- **Pros:** Simple, targeted fix
- **Cons:** Doesn't protect against future misuse of uploadAudioFromUrl
- **Effort:** Small
- **Risk:** Low

### Option B: Add URL allowlist + response size limit to axios call
- **Pros:** Defense in depth, protects against SSRF regardless of caller
- **Cons:** Slightly more complex
- **Effort:** Small
- **Risk:** Low

## Recommended Action

Both — validate videoId with the same regex used in streaming routes (`/^[a-zA-Z0-9][a-zA-Z0-9_-]{4,19}$/`), AND add `maxContentLength` limit (e.g., 50MB) to the axios download.

## Technical Details

- **Affected files:** `ktv-singer-server/server/features/vocal-separation/lalalai.service.ts`, `vocal-separation.routes.ts`

## Acceptance Criteria

- [ ] videoId is validated before constructing the YouTube URL for vocal separation
- [ ] axios.get has a reasonable maxContentLength (e.g., 50MB)
- [ ] Arbitrary URLs cannot be fetched by the server

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-13 | Identified during code review | Chained with mass assignment makes this exploitable |

## Resources

- `ktv-singer-server/server/features/vocal-separation/lalalai.service.ts:63-80`
- `ktv-singer-server/server/features/vocal-separation/vocal-separation.routes.ts:32-34`
