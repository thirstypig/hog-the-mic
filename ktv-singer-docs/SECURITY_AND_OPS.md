# Security & Operational Readiness

Audit of PRs #5–#7 identified security and resilience gaps. This document tracks action items, completed fixes, and long-term roadmap.

## Completed (Top 5 Risks + Short-term Wins)

### 1. Rate-limit session creation
- **File:** `server/features/pairing/pairing.routes.ts`
- In-memory per-IP rate limiter: max 10 sessions/minute per IP
- Global session cap: 100 max active sessions
- No new dependencies (simple timestamp array tracking)

### 2. Validate Socket.IO payloads
- **File:** `server/features/pairing/pairing.socket.ts`
- All string fields validated for existence and length caps
- `add_to_queue`: title ≤200, artist ≤200, videoId ≤20, songId ≤100, thumbnailUrl ≤500 or null
- `join_session`: sessionId UUID format, role enum, deviceName ≤100, tvSecret validated
- `audio_chunk`: payload size ≤64KB
- `reorder_queue`: queueId string, newIndex non-negative integer
- `remove_from_queue`: queueId string
- `score_update`/`final_score`: ≤10KB string

### 3. Session secret for TV role protection
- **Files:** `pairing.routes.ts`, `pairing.socket.ts`, `pairing.types.ts`
- Session creation generates a `tvSecret` (random token) returned to creator
- `join_session` with `role: "tv"` requires matching `tvSecret`
- Singer role intentionally open (easy join via QR scan)
- QR code payload should include tvSecret alongside serverURL + sessionId

### 4. Fetch timeouts on LRCLIB and YouTube scrape
- **Files:** `lrclib.service.ts`, `search.routes.ts`
- `AbortSignal.timeout(5000)` added to LRCLIB fetch calls
- `AbortSignal.timeout(10000)` added to YouTube scrape fallback

### 5. Startup check for yt-dlp
- **File:** `server/index.ts`
- Runs `yt-dlp --version` at startup with 5s timeout
- Logs warning if missing (non-fatal — other features still work)

### 6. Health check endpoint
- **File:** `server/routes.ts`
- `GET /api/health` → `{ status: "ok", uptime: <seconds> }`
- No auth required

### 7. Socket.IO maxHttpBufferSize
- **File:** `server/features/pairing/pairing.socket.ts`
- Set to 256KB to cap any single WebSocket message

### 8. Tighter videoId validation
- **File:** `server/features/streaming/streaming.routes.ts`
- Regex: `/^[a-zA-Z0-9_-]{5,20}$/` — prevents non-alphanumeric chars reaching yt-dlp

## Long-term Roadmap

### Authentication & Authorization
- [ ] Require auth for session creation (prevent anonymous abuse)
- [ ] Add per-session tokens for queue manipulation (not just TV secret)
- [ ] Rate-limit socket events per connection (e.g., max 30 events/minute)

### Persistence & Durability
- [ ] Move session state to Redis/DB for multi-instance support
- [ ] Persist queue state across server restarts
- [ ] Add session activity logging for debugging

### Network & Infrastructure
- [ ] Add HTTPS/TLS termination guide for production
- [ ] Document reverse proxy setup (nginx/caddy)
- [ ] Add WebSocket health monitoring
- [ ] Consider connection pooling for yt-dlp calls

### Monitoring & Observability
- [ ] Structured logging (JSON format)
- [ ] Error tracking integration (Sentry or similar)
- [ ] Metrics endpoint (Prometheus-compatible)
- [ ] Dashboard for active sessions, queue depth, stream cache hit rate

### Content Security
- [ ] Validate YouTube video IDs against YouTube API before streaming
- [ ] Content filtering / blocklist for video IDs
- [ ] Rate-limit stream URL requests per session

## Deployment Constraints

- **Single-instance only**: Session state is in-memory. No horizontal scaling without migrating to Redis/DB.
- **yt-dlp dependency**: Must be installed on the server host (`brew install yt-dlp`). Streaming fails without it but other features continue.
- **YouTube URL expiry**: Stream URLs cached 4 hours, expire ~6 hours. Cache is in-memory (lost on restart).
- **Session TTL**: 4 hours. Sessions auto-prune on next creation request.
