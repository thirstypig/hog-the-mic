import { Server as SocketIOServer } from "socket.io";
import type { Server } from "http";
import { randomUUID } from "crypto";
import type { SessionStore } from "./session-store";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SessionMember,
  QueueEntry,
} from "./pairing.types";

// ── Validation helpers ──────────────────────────────────────────

function validateString(val: unknown, maxLen: number): val is string {
  return typeof val === "string" && val.length > 0 && val.length <= maxLen;
}

function validateOptionalString(val: unknown, maxLen: number): val is string | null | undefined {
  return val === null || val === undefined || (typeof val === "string" && val.length <= maxLen);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Per-socket rate limiter ─────────────────────────────────────

interface RateLimitConfig {
  windowMs: number;
  maxEvents: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // High-frequency: audio streaming (~4 events/sec expected)
  audio_chunk: { windowMs: 1000, maxEvents: 10 },
  audio_start: { windowMs: 5000, maxEvents: 5 },
  audio_stop: { windowMs: 5000, maxEvents: 5 },
  // Medium-frequency: queue/session management
  add_to_queue: { windowMs: 5000, maxEvents: 5 },
  remove_from_queue: { windowMs: 5000, maxEvents: 10 },
  reorder_queue: { windowMs: 2000, maxEvents: 5 },
  skip_song: { windowMs: 3000, maxEvents: 2 },
  song_finished: { windowMs: 3000, maxEvents: 2 },
  // Low-frequency: scoring
  score_update: { windowMs: 1000, maxEvents: 5 },
  final_score: { windowMs: 5000, maxEvents: 2 },
  // Session join
  join_session: { windowMs: 5000, maxEvents: 3 },
};

/** Sliding-window rate limiter per socket per event type */
class SocketRateLimiter {
  // socketId → eventName → timestamps[]
  private windows = new Map<string, Map<string, number[]>>();

  /** Returns true if the event should be allowed */
  allow(socketId: string, event: string): boolean {
    const config = RATE_LIMITS[event];
    if (!config) return true; // no limit configured

    const now = Date.now();
    if (!this.windows.has(socketId)) {
      this.windows.set(socketId, new Map());
    }
    const socketWindows = this.windows.get(socketId)!;
    if (!socketWindows.has(event)) {
      socketWindows.set(event, []);
    }
    const timestamps = socketWindows.get(event)!;

    // Remove expired timestamps
    const cutoff = now - config.windowMs;
    while (timestamps.length > 0 && timestamps[0] <= cutoff) {
      timestamps.shift();
    }

    if (timestamps.length >= config.maxEvents) {
      return false;
    }

    timestamps.push(now);
    return true;
  }

  /** Clean up when a socket disconnects */
  remove(socketId: string) {
    this.windows.delete(socketId);
  }
}

export function setupPairingSocket(httpServer: Server, sessionStore: SessionStore): SocketIOServer {
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    {
      path: "/socket.io",
      cors: { origin: "*", methods: ["GET", "POST"] },
      maxHttpBufferSize: 256 * 1024, // 256KB max per message
    },
  );

  const pairing = io.of("/pairing");
  const rateLimiter = new SocketRateLimiter();

  /** Returns true if the event is allowed (not rate-limited) */
  function checkRate(socketId: string, event: string): boolean {
    return rateLimiter.allow(socketId, event);
  }

  /** Map socketId → { sessionId, role } for cleanup on disconnect */
  const socketSessionMap = new Map<
    string,
    { sessionId: string; role: "tv" | "singer"; deviceName: string }
  >();

  pairing.on("connection", (socket) => {
    console.log(`[pairing] connected: ${socket.id}`);

    // ── join_session ──────────────────────────────────────────
    socket.on("join_session", async (payload) => {
      try {
        if (!checkRate(socket.id, "join_session")) return;
        const { sessionId, role, deviceName } = payload;

        // Validate payload
        if (!validateString(sessionId, 100) || !UUID_RE.test(sessionId)) {
          socket.emit("error", { message: "Invalid session ID" });
          return;
        }
        if (role !== "tv" && role !== "singer") {
          socket.emit("error", { message: "Invalid role" });
          return;
        }
        if (!validateString(deviceName, 100)) {
          socket.emit("error", { message: "Invalid device name" });
          return;
        }

        const session = await sessionStore.get(sessionId);
        if (!session) {
          socket.emit("error", { message: "Session not found" });
          return;
        }

        // TV role requires matching tvSecret
        if (role === "tv") {
          const tvSecret = (payload as any).tvSecret;
          if (!tvSecret || tvSecret !== session.tvSecret) {
            socket.emit("error", { message: "Invalid TV secret" });
            return;
          }

          // Only one TV per session — evict existing
          for (const [socketId, m] of Object.entries(session.members)) {
            if (m.role === "tv") {
              delete session.members[socketId];
              socketSessionMap.delete(socketId);
              break;
            }
          }
        }

        // Register member
        const member: SessionMember = {
          socketId: socket.id,
          role,
          deviceName,
          joinedAt: Date.now(),
        };
        session.members[socket.id] = member;
        await sessionStore.update(session);
        socketSessionMap.set(socket.id, { sessionId, role, deviceName });

        // Join the socket.io room
        const room = `session:${sessionId}`;
        socket.join(room);

        // Confirm to the joining client
        socket.emit("paired", { sessionId, role });

        // Notify the room about the new singer
        if (role === "singer") {
          socket.to(room).emit("singer_joined", {
            socketId: socket.id,
            deviceName,
          });
        }

        // Broadcast current session state to everyone in the room
        await emitSessionState(sessionId);

        // Send current queue state to the newly joined client
        await emitQueueUpdated(sessionId);
      } catch (err) {
        console.error("[pairing] join_session error:", err);
        socket.emit("error", { message: "Internal error" });
      }
    });

    // ── Queue events ─────────────────────────────────────────

    socket.on("add_to_queue", async (payload) => {
      try {
        if (!checkRate(socket.id, "add_to_queue")) return;
        const info = socketSessionMap.get(socket.id);
        if (!info) return;

        // Validate payload
        if (!validateString(payload.songId, 100)) {
          socket.emit("error", { message: "Invalid songId" });
          return;
        }
        if (!validateString(payload.videoId, 20)) {
          socket.emit("error", { message: "Invalid videoId" });
          return;
        }
        if (!validateString(payload.title, 200)) {
          socket.emit("error", { message: "Invalid title" });
          return;
        }
        if (!validateString(payload.artist, 200)) {
          socket.emit("error", { message: "Invalid artist" });
          return;
        }
        if (!validateOptionalString(payload.thumbnailUrl, 500)) {
          socket.emit("error", { message: "Invalid thumbnailUrl" });
          return;
        }

        const session = await sessionStore.get(info.sessionId);
        if (!session) return;

        // 10-song limit (queue + currently playing)
        const totalSongs =
          session.queue.length + (session.currentlyPlaying ? 1 : 0);
        if (totalSongs >= 10) {
          socket.emit("error", { message: "Queue is full (max 10 songs)" });
          return;
        }

        const entry: QueueEntry = {
          queueId: randomUUID(),
          songId: payload.songId,
          videoId: payload.videoId,
          title: payload.title,
          artist: payload.artist,
          thumbnailUrl: payload.thumbnailUrl,
          addedBy: info.deviceName,
          addedBySocketId: socket.id,
          addedAt: Date.now(),
        };

        // If nothing playing and queue empty, start playing immediately
        if (!session.currentlyPlaying && session.queue.length === 0) {
          session.currentlyPlaying = entry;
          await sessionStore.update(session);
          pairing.to(`session:${info.sessionId}`).emit("play_song", {
            sessionId: info.sessionId,
            entry,
          });
        } else {
          session.queue.push(entry);
          await sessionStore.update(session);
        }

        await emitQueueUpdated(info.sessionId);
      } catch (err) {
        console.error("[pairing] add_to_queue error:", err);
      }
    });

    socket.on("remove_from_queue", async (payload) => {
      try {
        if (!checkRate(socket.id, "remove_from_queue")) return;
        const info = socketSessionMap.get(socket.id);
        if (!info) return;

        if (!validateString(payload.queueId, 100)) {
          socket.emit("error", { message: "Invalid queueId" });
          return;
        }

        const session = await sessionStore.get(info.sessionId);
        if (!session) return;

        session.queue = session.queue.filter(
          (e) => e.queueId !== payload.queueId,
        );
        await sessionStore.update(session);
        await emitQueueUpdated(info.sessionId);
      } catch (err) {
        console.error("[pairing] remove_from_queue error:", err);
      }
    });

    socket.on("reorder_queue", async (payload) => {
      try {
        if (!checkRate(socket.id, "reorder_queue")) return;
        const info = socketSessionMap.get(socket.id);
        if (!info) return;

        if (!validateString(payload.queueId, 100)) {
          socket.emit("error", { message: "Invalid queueId" });
          return;
        }
        if (typeof payload.newIndex !== "number" || !Number.isInteger(payload.newIndex) || payload.newIndex < 0) {
          socket.emit("error", { message: "Invalid newIndex" });
          return;
        }

        const session = await sessionStore.get(info.sessionId);
        if (!session) return;

        const idx = session.queue.findIndex(
          (e) => e.queueId === payload.queueId,
        );
        if (idx === -1) return;

        const [entry] = session.queue.splice(idx, 1);
        const clampedIndex = Math.max(
          0,
          Math.min(payload.newIndex, session.queue.length),
        );
        session.queue.splice(clampedIndex, 0, entry);
        await sessionStore.update(session);
        await emitQueueUpdated(info.sessionId);
      } catch (err) {
        console.error("[pairing] reorder_queue error:", err);
      }
    });

    socket.on("skip_song", async () => {
      try {
        if (!checkRate(socket.id, "skip_song")) return;
        const info = socketSessionMap.get(socket.id);
        if (!info) return;
        await advanceQueue(info.sessionId);
      } catch (err) {
        console.error("[pairing] skip_song error:", err);
      }
    });

    socket.on("song_finished", async () => {
      try {
        if (!checkRate(socket.id, "song_finished")) return;
        const info = socketSessionMap.get(socket.id);
        if (!info) return;
        // Only accept from TV role
        if (info.role !== "tv") return;
        await advanceQueue(info.sessionId);
      } catch (err) {
        console.error("[pairing] song_finished error:", err);
      }
    });

    // ── Audio relay (Phase 2 prep — passthrough) ──────────────
    socket.on("audio_chunk", (data) => {
      if (!checkRate(socket.id, "audio_chunk")) return;
      const info = socketSessionMap.get(socket.id);
      if (!info) return;

      // Cap audio chunk size at 64KB
      const chunkSize = Buffer.isBuffer(data) ? data.length : typeof data === "string" ? (data as string).length : 0;
      if (chunkSize > 65_536) return;

      socket.to(`session:${info.sessionId}`).emit("audio_chunk", data);
    });

    socket.on("audio_start", () => {
      if (!checkRate(socket.id, "audio_start")) return;
      const info = socketSessionMap.get(socket.id);
      if (!info) return;
      socket
        .to(`session:${info.sessionId}`)
        .emit("audio_start", { socketId: socket.id });
    });

    socket.on("audio_stop", () => {
      if (!checkRate(socket.id, "audio_stop")) return;
      const info = socketSessionMap.get(socket.id);
      if (!info) return;
      socket
        .to(`session:${info.sessionId}`)
        .emit("audio_stop", { socketId: socket.id });
    });

    // ── Score relay (Phase 3 prep — passthrough) ──────────────
    socket.on("score_update", (data) => {
      if (!checkRate(socket.id, "score_update")) return;
      const info = socketSessionMap.get(socket.id);
      if (!info) return;
      if (typeof data !== "string" || data.length > 10_240) return;
      socket.to(`session:${info.sessionId}`).emit("score_update", data);
    });

    socket.on("final_score", (data) => {
      if (!checkRate(socket.id, "final_score")) return;
      const info = socketSessionMap.get(socket.id);
      if (!info) return;
      if (typeof data !== "string" || data.length > 10_240) return;
      socket.to(`session:${info.sessionId}`).emit("final_score", data);
    });

    // ── disconnect ────────────────────────────────────────────
    socket.on("disconnect", async () => {
      try {
        console.log(`[pairing] disconnected: ${socket.id}`);

        const info = socketSessionMap.get(socket.id);
        if (!info) return;

        const session = await sessionStore.get(info.sessionId);
        if (session) {
          delete session.members[socket.id];

          if (info.role === "singer") {
            pairing
              .to(`session:${info.sessionId}`)
              .emit("singer_left", {
                socketId: socket.id,
                deviceName: info.deviceName,
              });
          }

          // Clean up empty sessions
          if (Object.keys(session.members).length === 0) {
            await sessionStore.delete(info.sessionId);
          } else {
            await sessionStore.update(session);
            await emitSessionState(info.sessionId);
          }
        }

        socketSessionMap.delete(socket.id);
        rateLimiter.remove(socket.id);
      } catch (err) {
        console.error("[pairing] disconnect error:", err);
      }
    });
  });

  async function emitSessionState(sessionId: string) {
    const session = await sessionStore.get(sessionId);
    if (!session) return;

    const singers: Array<{ socketId: string; deviceName: string }> = [];
    let tvConnected = false;
    for (const m of Object.values(session.members)) {
      if (m.role === "singer") {
        singers.push({ socketId: m.socketId, deviceName: m.deviceName });
      }
      if (m.role === "tv") {
        tvConnected = true;
      }
    }

    pairing.to(`session:${sessionId}`).emit("session_state", {
      sessionId,
      singers,
      tvConnected,
    });
  }

  async function emitQueueUpdated(sessionId: string) {
    const session = await sessionStore.get(sessionId);
    if (!session) return;

    pairing.to(`session:${sessionId}`).emit("queue_updated", {
      sessionId,
      currentlyPlaying: session.currentlyPlaying,
      upcoming: session.queue,
    });
  }

  async function advanceQueue(sessionId: string) {
    const session = await sessionStore.get(sessionId);
    if (!session) return;

    if (session.queue.length > 0) {
      const next = session.queue.shift()!;
      session.currentlyPlaying = next;
      await sessionStore.update(session);
      pairing.to(`session:${sessionId}`).emit("play_song", {
        sessionId,
        entry: next,
      });
    } else {
      session.currentlyPlaying = null;
      await sessionStore.update(session);
    }

    await emitQueueUpdated(sessionId);
  }

  return io;
}
