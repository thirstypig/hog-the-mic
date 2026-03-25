---
status: pending
priority: p1
issue_id: "019"
tags: [code-review, security, server]
dependencies: []
---

# SSRF in LALAL.AI and Gaudio Audio Upload Services

## Problem Statement

Both `LalalAIService.uploadAudioFromUrl()` and `GaudioStudioService.uploadAudioFromUrl()` accept an arbitrary URL and make server-side HTTP requests to download data. While current callers construct URLs from validated videoIds, the service methods are public APIs that accept any URL. A future caller could enable SSRF attacks (cloud metadata at 169.254.169.254, internal network scanning). Gaudio service also lacks `maxContentLength` and `timeout` limits.

## Findings

- **File:** `ktv-singer-server/server/features/vocal-separation/lalalai.service.ts:63-70`
- **File:** `ktv-singer-server/server/features/vocal-separation/gaudio.service.ts:65`
- **Evidence:** `axios.get(audioUrl, { responseType: 'arraybuffer' })` with no URL validation
- **Agents:** Security Sentinel (CRITICAL-01)

## Proposed Solution

Add URL allowlist validation in both services — only permit `https://www.youtube.com/*` and `https://*.googlevideo.com/*`. Block private/reserved IP ranges. Add maxContentLength and timeout to Gaudio service.

## Acceptance Criteria

- [ ] URL allowlist validation added to both services
- [ ] Private IP ranges blocked
- [ ] Gaudio service has maxContentLength (50MB) and timeout (60s)

## Work Log

| Date | Action |
|------|--------|
| 2026-03-24 | Created from code review |
