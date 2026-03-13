# Deployment Guide

## Architecture

The KTV Singer server runs as a Docker container with:
- **Node.js 20** — Express API + Socket.IO
- **yt-dlp** — YouTube stream URL extraction (installed via pip)
- **ffmpeg** — Audio/video processing
- **Redis** — Persistent session and stream cache (optional, in-memory fallback)

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Supabase PostgreSQL connection string |
| `REDIS_URL` | No | Redis connection URL (sessions persist across restarts) |
| `YOUTUBE_API_KEY` | Yes | YouTube Data API key (search) |
| `SESSION_SECRET` | Yes | Express session signing secret |
| `OIDC_ISSUER_URL` | No | Google OIDC issuer (auth optional in dev) |
| `OIDC_CLIENT_ID` | No | Google OAuth client ID |
| `OIDC_CLIENT_SECRET` | No | Google OAuth client secret |
| `APP_URL` | No | Public URL for OAuth callbacks |
| `PORT` | No | Server port (default: 4040) |
| `NODE_ENV` | No | `production` or `development` |

## Railway

1. Connect your GitHub repository
2. Add a **Redis** plugin (Railway → New → Database → Redis)
3. Set environment variables in the service settings:
   - `DATABASE_URL` — from Supabase dashboard
   - `REDIS_URL` — auto-populated by Railway Redis plugin (`${{Redis.REDIS_URL}}`)
   - `YOUTUBE_API_KEY`, `SESSION_SECRET`, etc.
4. Railway auto-detects the Dockerfile and deploys on push
5. Note the public URL (e.g., `https://ktv-singer-production.up.railway.app`)

## Render

1. Create a new **Web Service** → Docker
2. Connect your GitHub repository
3. Create a **Redis** instance (Render → New → Redis)
4. Set environment variables:
   - `REDIS_URL` — from the Render Redis instance internal URL
   - All other variables as listed above
5. Set health check path: `/api/health`
6. Deploy

## Docker (manual)

```bash
# Build
docker build -t ktv-singer .

# Run (with external Redis)
docker run -p 4040:4040 \
  -e DATABASE_URL="..." \
  -e REDIS_URL="redis://your-redis:6385" \
  -e YOUTUBE_API_KEY="..." \
  -e SESSION_SECRET="..." \
  ktv-singer

# Run (without Redis — in-memory, sessions lost on restart)
docker run -p 4040:4040 \
  -e DATABASE_URL="..." \
  -e YOUTUBE_API_KEY="..." \
  -e SESSION_SECRET="..." \
  ktv-singer
```

## Health Check

```
GET /api/health
→ { "status": "ok", "uptime": 123.456 }
```

## Post-Deploy: Update Client URLs

After deploying, update the server URL in:

- **tvOS**: Settings screen or `APIClient.swift` default URL
- **Mobile**: API base URL configuration (currently points to local IP)

## Redis Behavior

- **With Redis**: Pairing sessions and stream URL cache survive server restarts/deploys
- **Without Redis**: Everything is in-memory (local dev default). A restart kills all active sessions.
- Sessions auto-expire after 4 hours (Redis TTL)
- Stream URLs cached for 4 hours (YouTube URLs expire ~6 hours)
