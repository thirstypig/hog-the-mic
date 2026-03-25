---
title: "feat: Microphone Pipeline, Architecture Simplification, and Code Review Fixes"
type: feat
status: active
date: 2026-03-24
deepened: 2026-03-24
---

# Microphone Pipeline, Architecture Simplification, and Code Review Fixes

## Enhancement Summary

**Deepened on:** 2026-03-24
**Sections enhanced:** All 6 phases
**Research agents used:** expo-audio cross-platform, SSRF prevention, Socket.IO binary transport, express-rate-limit, Drizzle ORM indexes, code simplicity review, SpecFlow gap analyzer

### Key Improvements from Deepening
1. **Discovered `@siteed/expo-audio-studio`** — eliminates the record-stop-read file loop entirely, provides real PCM on Android (expo-audio cannot), and streaming callbacks at configurable intervals
2. **Simplicity review restructured the plan** — collapsed 6 phases to 3 for a home LAN app, cutting ~60% of security/performance work that defends against threats that can't reach the server
3. **SpecFlow gap analysis** found critical missing flows — socket disconnect handling, tvOS sender timeout, WAV header parsing fragility, mute battery waste
4. **Socket.IO binary transport** is straightforward — use `Uint8Array` in React Native (no polyfill), `.forceWebsockets(true)` on tvOS
5. **Drizzle 0.39.x** uses array callback pattern for indexes (not object pattern from older tutorials)

### Simplicity Review Insight

> *"The core mistake in this plan is applying a public-internet threat model to a home LAN application. Every security/performance fix should pass one test: 'Has this actually caused a problem for my family using the karaoke system?' If no, cut it."*

The plan below presents a **pragmatic restructure** (3 phases) informed by both the security review findings and the simplicity counterpoint. Security items are kept where they're quick wins or good coding hygiene, but enterprise-grade defenses (SSRF DNS pinning, HTTP rate limiting, Redis session counter) are moved to a "Future Hardening" appendix for if/when the app goes public.

---

## Overview

Three coordinated workstreams, restructured into 3 phases (down from 6):

1. **Phase 1: Ship the Microphone Feature** — the only user-facing value
2. **Phase 2: Clean Up the Codebase** — remove abstractions, deduplicate, standardize
3. **Phase 3: Fix Real Problems** — cherry-picked from code review, only items that affect daily use

---

## Problem Statement

### Microphone
The mic code exists across all three tiers but has never been tested end-to-end. Research revealed:
- **Android recording is broken** — `expo-audio` uses Android's `MediaRecorder` which **cannot produce WAV PCM**. The `"default"` encoder produces AMR in 3GP. This is a fundamental limitation, not a config issue.
- **Web recording is broken** — browsers don't support `audio/wav` in MediaRecorder. Falls back to WebM/Opus silently.
- **250ms chunk duration is borderline** — adds 400-600ms total latency. File I/O per chunk is the bottleneck.
- **Base64 encoding adds 33% overhead** — Socket.IO 4.x supports native binary.
- **Type mismatch** — shared types say `Buffer`, app sends base64 string via `as unknown as Buffer`.
- **No disconnect handling** — if phone goes to sleep or network drops, tvOS audio engine runs forever.

### Architecture
- `storage.ts`: 160 lines of pure delegation, partially bypassed
- 5 admin pages: ~800-1000 LOC of duplicated layout
- Error responses: `{ error }` vs `{ message }` inconsistency
- `any` types in auth layer when proper types already exist

### Code Review
19 pending findings. For a home LAN app, the pragmatic fixes are: mass assignment prevention (good hygiene), consistent error shapes, type safety improvements, and DB indexes if queries are slow.

---

## Phase 1: Ship the Microphone Feature

*Estimated effort: 2-3 sessions*
*Dependencies: None — this is the priority*

### 1.1 Decision: expo-audio vs @siteed/expo-audio-studio

Research revealed two paths:

| | expo-audio (current) | @siteed/expo-audio-studio |
|---|---|---|
| iOS PCM | ✅ Works | ✅ Works |
| Android PCM | ❌ Impossible (MediaRecorder) | ✅ Uses AudioRecord API |
| Web PCM | ❌ No WAV support | ✅ Uses AudioWorklet |
| Real-time callbacks | ❌ File I/O loop required | ✅ `onAudioStream` callback |
| Min chunk interval | ~250ms (file overhead) | ~100ms (no file I/O) |
| Requires | Expo Go compatible | Dev client / custom build (`npx expo prebuild`) |

**Recommendation:** Start with expo-audio on iOS (it works today, no migration needed). If you want Android/web mic support later, migrate to `@siteed/expo-audio-studio` — it's the only path to cross-platform PCM.

### 1.2 Fix Type Contract

**Files:** `ktv-singer-shared/pairing/pairing.types.ts`

```typescript
// Discriminated union for join_session (fixes (payload as any).tvSecret cast)
export type JoinSessionPayload =
  | { sessionId: string; role: 'singer'; deviceName: string }
  | { sessionId: string; role: 'tv'; deviceName: string; tvSecret: string };

// Audio format constants — single source of truth for both app and tvOS
export const AUDIO_FORMAT = {
  sampleRate: 16000,
  channels: 1,
  bitDepth: 16,
  encoding: 'pcm-s16le',
  bytesPerFrame: 2,
} as const;
```

### 1.3 Reduce Chunk Duration + Use Faster File Reading

**File:** `ktv-singer-app/src/features/mic/hooks/useMicrophone.ts`

```typescript
const CHUNK_DURATION_MS = 100; // down from 250 — cuts 150ms latency

// Use FileHandle.readBytes() instead of file.base64() — ~10x faster
import { File as ExpoFile } from 'expo-file-system';

// In the recording loop:
const file = new ExpoFile(uri);
const fh = await file.open();
const bytes = await fh.readBytes(fh.size);  // Uint8Array, no base64
await fh.close();

// Send as binary — Socket.IO auto-detects Uint8Array
sock.emit("audio_chunk", bytes);  // BINARY_EVENT, native WebSocket frame
```

### Research Insight: Socket.IO Binary Transport

> Socket.IO 4.x auto-detects `Buffer`, `ArrayBuffer`, `Uint8Array`, and `Blob`. When using WebSocket transport, binary frames are sent natively — no base64. On HTTP long-polling fallback, binary is base64-encoded. Use `transports: ["websocket"]` on all clients to ensure native binary.

**React Native:** Use `Uint8Array` directly — native to Hermes, no polyfill needed.
**tvOS:** Set `.forceWebsockets(true)` — eliminates polling-related binary issues.

### 1.4 Add Socket Disconnect Handling (SpecFlow Gap)

**File:** `ktv-singer-app/src/features/mic/hooks/useMicrophone.ts`

The SpecFlow analysis found that if the phone goes to background or loses network, the recording loop continues but chunks are silently dropped. The user sees "Streaming to TV" while nothing reaches the TV.

```typescript
// Add to startStreaming():
const socket = getSocket();
if (!socket?.connected) { /* error */ }

// Listen for disconnect — auto-stop streaming
socket.on('disconnect', () => {
  if (isStreamingRef.current) {
    isStreamingRef.current = false;
    setStatus('error');
    try { recorder.stop(); } catch {}
  }
});
```

### 1.5 Add tvOS Sender Timeout (SpecFlow Gap)

**File:** `ktv-singer-tvos/Shared/Services/AudioStreamService.swift`

If the phone crashes without sending `audio_stop`, the tvOS audio engine runs forever.

```swift
// Add a 5-second timeout per sender
private var lastChunkTime: [String: Date] = [:]  // socketId → last chunk time

// In playChunk, update timestamp:
lastChunkTime[socketId] = Date()

// Add a timer that checks every 3 seconds:
Timer.scheduledTimer(withTimeInterval: 3.0, repeats: true) { [weak self] _ in
    guard let self = self else { return }
    let cutoff = Date().addingTimeInterval(-5.0)
    let stale = self.lastChunkTime.filter { $0.value < cutoff }
    for (socketId, _) in stale {
        self.activeSenders.remove(socketId)
        self.lastChunkTime.removeValue(forKey: socketId)
    }
    if self.activeSenders.isEmpty && self.isReceiving {
        self.isReceiving = false
        self.audioLevel = 0
        self.stopEngine()
    }
}
```

### 1.6 Strip WAV Headers Before Sending

**File:** `ktv-singer-app/src/features/mic/hooks/useMicrophone.ts`

Strip the 44-byte WAV header on the sender side to save bandwidth and simplify the receiver. The tvOS side already handles headerless PCM.

```typescript
// After readBytes:
let pcmBytes = bytes;
// Check for WAV header ("RIFF" magic bytes)
if (bytes.length > 44 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
  pcmBytes = bytes.slice(44);
}
sock.emit("audio_chunk", pcmBytes);
```

### Research Insight: WAV Header Fragility

> SpecFlow found that WAV headers can be longer than 44 bytes if expo-audio adds metadata chunks (LIST, INFO). A more robust approach is to find the "data" chunk marker and skip to the actual PCM data. However, for the initial implementation, the 44-byte assumption is safe with expo-audio's LINEARPCM output on iOS.

### 1.7 tvOS: Force WebSocket + Accept Binary

**File:** `ktv-singer-tvos/Features/Pairing/Services/SocketPairingService.swift`

```swift
let manager = SocketManager(
    socketURL: URL(string: serverURL)!,
    config: [
        .forceWebsockets(true),  // critical for binary transport
        .compress
    ]
)
```

**File:** `ktv-singer-tvos/Shared/Services/AudioStreamService.swift`

Update `playChunk` to accept both `Data` (binary) and `String` (base64 fallback):

```swift
socketService.on("audio_chunk") { [weak self] data in
    Task { @MainActor in
        guard let self = self else { return }
        if let audioData = data.first as? Data {
            // Binary transport — direct Data
            self.playChunkFromPCM(audioData)
        } else if let base64String = data.first as? String {
            // Fallback — base64 encoded
            guard let rawData = Data(base64Encoded: base64String) else { return }
            self.playChunkFromPCM(rawData)
        }
    }
}
```

### 1.8 Test End-to-End on iPhone + Apple TV

**Manual test plan:**
1. `cd ktv-singer-server && npm run dev`
2. `cd ktv-singer-app && npm start` → run on iPhone
3. Open tvOS app on Apple TV
4. Pair phone to TV via QR code
5. Navigate to Mic screen, tap to start
6. ✅ Permission prompt → audio streams → TV plays voice
7. ✅ Mute/unmute toggle works
8. ✅ Lock phone → streaming stops, status updates
9. ✅ Kill app → tvOS engine stops within 5 seconds (sender timeout)
10. ✅ Play a song → voice comes through alongside karaoke track

### 1.9 Platform Feature Flags (Defer Android/Web)

**File:** `ktv-singer-app/src/features/mic/hooks/useMicrophone.ts`

```typescript
import { Platform } from 'react-native';

const MIC_SUPPORTED = Platform.OS === 'ios';
// Expand when @siteed/expo-audio-studio is adopted

export type MicStatus = "idle" | "requesting" | "streaming" | "muted" | "error" | "unsupported";
```

**File:** `ktv-singer-app/src/screens/MicScreen.tsx` — show "Microphone available on iPhone only" for unsupported platforms.

---

## Phase 2: Clean Up the Codebase

*Estimated effort: 2 sessions*
*Dependencies: None (can run in parallel with Phase 1)*

### 2.1 Remove Storage Abstraction Layer

Delete `ktv-singer-server/server/storage.ts`. Update 7 route files to import directly from feature storage modules.

**Cross-feature import exception:** `vocal-separation.routes.ts` needs `getSong()` from songs storage. Accept this read-only cross-feature import and document it in CLAUDE.md.

**LOC removed:** ~160

### 2.2 Extract Admin Page Shared Layout

Create `ktv-singer-server/server/features/tech/shared-layout.ts` with `wrapInAdminPage(title, bodyContent)`.

**LOC removed:** ~800-1000

### 2.3 Standardize Error Response Shape

Replace `{ message: "..." }` with `{ error: "..." }` in auth middleware, auth routes, and pairing routes. Update global error handler in `index.ts:76`.

### 2.4 Eliminate `any` Types

- `auth.setup.ts` → use `AuthenticatedUser`, `OidcClaims` (types already exist)
- `lalalai.service.ts` → use `AxiosError` (already in axios package)
- `streaming.service.ts` → define `YtDlpOutput` interface
- `search.routes.ts` → define `InvidiousVideo` interface, proper query param narrowing
- `pairing.socket.ts` → use discriminated union from Phase 1.2

### 2.5 Quick Security Hygiene

These are fast, low-effort fixes that are good coding practice regardless of threat model:

- **Playlist mass assignment** — add `updatePlaylistSchema` in shared, validate in route (~20 min)
- **CORS hardcode** — replace dynamic origin parsing with hardcoded LAN origins in one shared utility (~10 min)
- **Missing auth on lyrics-offset** — add `requireAuthIfConfigured` to the one unprotected mutating route (~5 min)
- **Gaudio limits** — add `maxContentLength: 50MB`, `timeout: 60s`, `maxRedirects: 0` to the axios call (~5 min)

---

## Phase 3: Fix Measured Problems

*Estimated effort: 1 session*
*Dependencies: Phase 2 (storage removal must be done first)*

Only fix what you've actually experienced or can measure:

### 3.1 Database Indexes (If Queries Are Slow)

### Research Insight: Drizzle 0.39.x Index Syntax

```typescript
import { pgTable, varchar, index, uniqueIndex } from "drizzle-orm/pg-core";

export const performances = pgTable("performances", {
  // ... columns
}, (table) => [
  index("performances_song_id_idx").on(table.songId),
  index("performances_user_id_idx").on(table.userId),
]);

export const userSongPlays = pgTable("user_song_plays", {
  // ... columns
}, (table) => [
  uniqueIndex("user_song_plays_user_song_idx").on(table.userId, table.songId),
]);
```

**Gotcha:** Must deduplicate existing rows before adding unique index. Run `npx drizzle-kit push --dry-run` first to preview SQL.

### 3.2 tvOS Type Drift

Update Swift models to match current TypeScript definitions. Add missing `addedBySocketId` to `QueueEntry.swift`. Make all non-essential fields optional.

### 3.3 Install Helmet (One Line)

```bash
npm install helmet
```

```typescript
import helmet from 'helmet';
app.use(helmet());
```

### 3.4 yt-dlp Queue Bounds (If Concurrent Downloads Crash)

Only if you experience problems. Add `MAX_QUEUE_LENGTH = 20` and `QUEUE_TIMEOUT_MS = 60000`.

---

## Future Hardening (If App Goes Public)

These items are documented but deferred — they defend against threats that don't exist on a home LAN:

<details>
<summary>Click to expand enterprise-grade security items</summary>

### SSRF Prevention (Full Implementation)

The security research produced a comprehensive ~100-line SSRF validator with DNS pinning, IPv6 bypass prevention, and redirect blocking. File: research output from Security Sentinel. Key components:
- URL allowlist validation
- DNS resolution + private IP range blocking
- Custom `httpsAgent.lookup` to pin resolved IP (prevents DNS rebinding TOCTOU)
- `maxRedirects: 0` (prevents redirect-to-internal)
- IPv4-mapped IPv6 detection

### HTTP Rate Limiting (express-rate-limit)

Research produced a tiered config:
- Global: 200 req/min
- Search: 10/min (amplification risk)
- Streaming: 20/min (subprocess cost)
- Vocal separation: 3/min (LALAL.AI cost)
- Skip Socket.IO paths: `req.path.startsWith('/socket.io')`

### Redis Session Counter

Replace manual `REDIS_COUNT_KEY` with `SCAN` of `session:*` keys.

### Auth Enforcement in Production

If `NODE_ENV=production` and OIDC vars missing, refuse to start.

### Error Message Sanitization

In production, return generic messages to clients. Log details server-side only.

</details>

---

## Technical Approach

### Architecture

```
┌─────────────────┐     Socket.IO      ┌─────────────────┐
│  iPhone (Expo)  │ ──── audio_chunk ──→│  Express Server  │
│  useMicrophone  │  (Uint8Array PCM)   │  pairing.socket  │
│  100ms chunks   │  [websocket only]   │  (passthrough)   │
└─────────────────┘                     └────────┬────────┘
                                                 │
                                        Socket.IO│audio_chunk
                                        [websocket│+ binary]
                                                 │
                                        ┌────────▼────────┐
                                        │  Apple TV (tvOS) │
                                        │  AudioStreamSvc  │
                                        │  AVAudioEngine   │
                                        │  forceWebsockets │
                                        └─────────────────┘
```

**Audio pipeline specs:**
- Format: PCM signed 16-bit little-endian, 16kHz, mono
- Chunk duration: 100ms (1,600 samples = 3,200 bytes)
- Transport: Socket.IO binary over WebSocket (no base64, no polling)
- File reading: `FileHandle.readBytes()` (~10x faster than base64)
- Disconnect: auto-stop on socket disconnect + 5s tvOS sender timeout

### Implementation Phases

| Phase | Focus | Effort | Sessions | Depends On |
|-------|-------|--------|----------|------------|
| 1 | iOS Mic Pipeline | Medium | 2-3 | — |
| 2 | Codebase Cleanup | Medium | 2 | — (parallel with 1) |
| 3 | Fix Measured Problems | Small | 1 | Phase 2 |

**Total estimated: 5-6 sessions** (down from 10+ in original plan)

---

## Acceptance Criteria

### Functional Requirements
- [ ] iPhone mic captures voice and plays through Apple TV speakers *(code done, needs hardware test)*
- [ ] Mic mute/unmute works correctly *(code done, needs hardware test)*
- [x] Phone backgrounding / disconnect stops streaming cleanly
- [x] tvOS auto-stops audio engine if no chunks for 5 seconds
- [x] Android/web show "mic not supported" gracefully
- [x] Storage abstraction removed, routes import directly
- [ ] Admin pages share layout module *(deferred — ~800 LOC mechanical extraction)*
- [x] Error responses consistently use `{ error: string }`
- [ ] Zero `any` types in auth layer *(deferred — multiple files, no functional impact)*
- [ ] Playlist updates validated with schema *(deferred — needs shared schema change)*

### Non-Functional Requirements
- [ ] Audio latency from phone to TV under 300ms on home LAN *(needs hardware test)*
- [x] `npm run check` passes in both server and app
- [x] No cross-feature imports (except documented vocal-separation exception)

### Quality Gates
- [ ] Mic tested with actual iPhone + Apple TV hardware
- [ ] Each phase committed separately to correct sub-project repos

---

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| expo-audio 100ms chunks too short on iOS | Medium | Medium | Fall back to 150ms; test empirically |
| Binary Socket.IO breaks tvOS | Low | Medium | Keep base64 fallback in tvOS `playChunk` |
| FileHandle.readBytes() not available in Expo SDK 55 | Low | Low | Fall back to base64 |
| Storage removal breaks imports | Low | Low | `npm run check` catches immediately |
| Shared package update breaks consumers | Medium | Medium | Update shared → server → app in sequence |

---

## Future: Cross-Platform Mic with expo-audio-studio

When you want Android/web mic support, migrate to `@siteed/expo-audio-studio`:

```bash
npx expo install @siteed/expo-audio-studio
npx expo prebuild  # required — has native code
```

```typescript
import { useAudioRecorder } from '@siteed/expo-audio-studio';

const { startRecording, stopRecording } = useAudioRecorder({
  sampleRate: 16000,
  channels: 1,
  encoding: 'pcm_16bit',
  interval: 100,  // ms between callbacks
  onAudioStream: async (event) => {
    const socket = getSocket();
    if (socket?.connected) {
      // event.audioDataBase64 — PCM data as base64
      socket.emit('audio_chunk', event.audioDataBase64);
    }
  },
});
```

This eliminates the record-stop-read loop entirely and provides real PCM on all platforms.

---

## Sources & References

### Internal
- Audio recording: `ktv-singer-app/src/features/mic/hooks/useMicrophone.ts:14-36`
- Server relay: `ktv-singer-server/server/features/pairing/pairing.socket.ts:397-414`
- tvOS playback: `ktv-singer-tvos/Shared/Services/AudioStreamService.swift:117-165`

### External
- Expo Audio docs: https://docs.expo.dev/versions/latest/sdk/audio/
- @siteed/expo-audio-studio: https://www.npmjs.com/package/@siteed/expo-audio-studio
- Socket.IO binary protocol: https://socket.io/docs/v4/engine-io-protocol/
- socket.io-client-swift binary: https://github.com/socketio/socket.io-client-swift/issues/1496
- AVAudioEngine streaming: https://www.syedharisali.com/articles/streaming-audio-with-avaudioengine/
- Expo FileHandle API: https://expo.dev/blog/expo-file-system
- Real-time audio React Native: https://www.callstack.com/blog/from-files-to-buffers-building-real-time-audio-pipelines-in-react-native
