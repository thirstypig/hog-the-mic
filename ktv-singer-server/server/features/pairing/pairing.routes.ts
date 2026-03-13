import type { Express } from "express";
import { randomUUID, randomBytes } from "crypto";
import type { PairingSession } from "./pairing.types";
import type { SessionStore } from "./session-store";

// ── Rate limiting (per-process, in-memory) ───────────────────────
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max sessions per IP per window
const MAX_TOTAL_SESSIONS = 100;
const ipRequestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = ipRequestLog.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
  ipRequestLog.set(ip, recent);
  return recent.length >= RATE_LIMIT_MAX;
}

function recordRequest(ip: string) {
  const timestamps = ipRequestLog.get(ip) || [];
  timestamps.push(Date.now());
  ipRequestLog.set(ip, timestamps);
}

export function registerPairingRoutes(app: Express, sessionStore: SessionStore) {
  /** POST /api/pairing/sessions — create a new ephemeral session */
  app.post("/api/pairing/sessions", async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";

    // Rate limit per IP
    if (isRateLimited(ip)) {
      res.status(429).json({ message: "Too many sessions created. Try again later." });
      return;
    }

    // Global session cap
    const count = await sessionStore.count();
    if (count >= MAX_TOTAL_SESSIONS) {
      res.status(503).json({ message: "Server at capacity. Try again later." });
      return;
    }

    recordRequest(ip);

    const id = randomUUID();
    const tvSecret = randomBytes(16).toString("hex");
    const session: PairingSession = {
      id,
      tvSecret,
      createdAt: Date.now(),
      members: {},
      queue: [],
      currentlyPlaying: null,
    };
    await sessionStore.create(session);

    res.json({ sessionId: id, tvSecret });
  });

  /** GET /api/pairing/sessions/:id — check if a session exists */
  app.get("/api/pairing/sessions/:id", async (req, res) => {
    const session = await sessionStore.get(req.params.id);
    if (!session) {
      res.status(404).json({ message: "Session not found" });
      return;
    }

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

    res.json({ sessionId: session.id, singers, tvConnected });
  });
}
