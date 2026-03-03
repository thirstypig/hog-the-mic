# YouTube Streaming Architecture

## Overview

tvOS has no WebView, so YouTube's IFrame Player API cannot be used. Instead, the Express server extracts playable stream URLs using `@distube/ytdl-core`, and the tvOS app plays them via native AVPlayer.

## Data Flow

```
tvOS App                    Express Server              YouTube
─────────                   ──────────────              ───────

YouTubePlayerService        streaming.service.ts
  │                           │
  │  GET /api/youtube/        │
  │  stream/:videoId          │
  ├──────────────────────────►│
  │                           │  ytdl.getInfo(videoId)
  │                           ├──────────────────────►│
  │                           │                       │
  │                           │◄──────────────────────┤
  │                           │  formats[]            │
  │                           │                       │
  │  { url, mimeType,        │  Select best combined
  │    quality, expiresAt }   │  mp4 format
  │◄──────────────────────────┤
  │
  │  AVPlayerItem(url: ...)
  │  AVPlayer.play()
  ▼
  Video plays on screen
```

## Server Endpoint

**`GET /api/youtube/stream/:videoId`**

Query params (optional):
- `type` — `video` (default)
- `quality` — `highest` (default)

Response:
```json
{
  "url": "https://rr5---sn-....googlevideo.com/videoplayback?...",
  "mimeType": "video/mp4; codecs=\"avc1.64001F, mp4a.40.2\"",
  "quality": "720p",
  "expiresAt": 1709424000000
}
```

## Format Selection

The service prefers formats in this order:

1. **Combined mp4** (video + audio in one stream) — best for AVPlayer
2. **Any combined format** (video + audio) — fallback
3. Error if no playable format found

Combined formats are preferred because AVPlayer handles single-stream playback natively. Adaptive formats (separate video + audio) would require an HLS manifest or manual muxing.

## Caching

- In-memory `Map<videoId, { info, expiresAt }>`
- TTL: 4 hours (YouTube URLs typically expire after ~6 hours)
- Expired entries are cleaned on each request
- Cache is not persistent (cleared on server restart)

## Error Handling

| Error | HTTP Status | Cause |
|-------|-------------|-------|
| Invalid video ID | 400 | videoId too short/long |
| No playable stream | 500 | Video has no combined formats (e.g., live streams) |
| ytdl extraction failed | 500 | Video unavailable, age-restricted, or region-locked |

## tvOS Client

`YouTubePlayerService.swift` calls `APIClient.shared.getStreamURL(videoId:)` then creates an `AVPlayerItem` with the returned URL. If the stream fails, a "Try Again" button re-attempts extraction (the URL may have expired).

## Limitations

- **URL expiration**: Stream URLs expire after ~6 hours. Long-paused videos may fail to resume.
- **Quality**: Combined formats max out at ~720p. Higher resolutions use adaptive streaming (DASH), which would require HLS proxy support.
- **Rate limiting**: YouTube may throttle or block requests from a single IP if overused.
- **No DRM content**: Some music videos with DRM protection cannot be extracted.

## Files

| File | Role |
|------|------|
| `server/features/streaming/streaming.service.ts` | URL extraction + caching |
| `server/features/streaming/streaming.routes.ts` | Express route handler |
| `server/features/streaming/index.ts` | Barrel exports |
| `tvos/Features/Player/Services/YouTubePlayerService.swift` | AVPlayer integration |
| `tvos/Shared/Networking/APIClient.swift` | HTTP client (`getStreamURL`) |
