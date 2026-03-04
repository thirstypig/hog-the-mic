import type { Express } from "express";
import { randomUUID } from "crypto";
import type { PairingSession } from "./pairing.types";

/** In-memory session store — shared with pairing.socket.ts */
export const sessions = new Map<string, PairingSession>();

/** Clean up sessions older than 4 hours */
const SESSION_TTL = 4 * 60 * 60 * 1000;

function pruneExpired() {
  const now = Date.now();
  const expired: string[] = [];
  sessions.forEach((session, id) => {
    if (now - session.createdAt > SESSION_TTL) {
      expired.push(id);
    }
  });
  expired.forEach((id) => sessions.delete(id));
}

export function registerPairingRoutes(app: Express) {
  /** POST /api/pairing/sessions — create a new ephemeral session */
  app.post("/api/pairing/sessions", (_req, res) => {
    pruneExpired();

    const id = randomUUID();
    const session: PairingSession = {
      id,
      createdAt: Date.now(),
      members: new Map(),
    };
    sessions.set(id, session);

    res.json({ sessionId: id });
  });

  /** GET /api/pairing/sessions/:id — check if a session exists */
  app.get("/api/pairing/sessions/:id", (req, res) => {
    const session = sessions.get(req.params.id);
    if (!session) {
      res.status(404).json({ message: "Session not found" });
      return;
    }

    const singers: Array<{ socketId: string; deviceName: string }> = [];
    let tvConnected = false;
    session.members.forEach((m) => {
      if (m.role === "singer") {
        singers.push({ socketId: m.socketId, deviceName: m.deviceName });
      }
      if (m.role === "tv") {
        tvConnected = true;
      }
    });

    res.json({ sessionId: session.id, singers, tvConnected });
  });
}
