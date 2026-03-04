import type { PairingSession } from "./pairing.types";
import { getRedis } from "../../redis";

// ── Interface ────────────────────────────────────────────────────

export interface SessionStore {
  get(id: string): Promise<PairingSession | null>;
  create(session: PairingSession): Promise<void>;
  update(session: PairingSession): Promise<void>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
}

// ── In-Memory Implementation ─────────────────────────────────────

const SESSION_TTL = 4 * 60 * 60 * 1000; // 4 hours
const MAX_SESSIONS = 100;

export class InMemorySessionStore implements SessionStore {
  private sessions = new Map<string, PairingSession>();

  private pruneExpired() {
    const now = Date.now();
    const expired: string[] = [];
    this.sessions.forEach((session, id) => {
      if (now - session.createdAt > SESSION_TTL) {
        expired.push(id);
      }
    });
    expired.forEach((id) => this.sessions.delete(id));
  }

  async get(id: string): Promise<PairingSession | null> {
    this.pruneExpired();
    return this.sessions.get(id) ?? null;
  }

  async create(session: PairingSession): Promise<void> {
    this.pruneExpired();
    this.sessions.set(session.id, session);
  }

  async update(session: PairingSession): Promise<void> {
    this.sessions.set(session.id, session);
  }

  async delete(id: string): Promise<void> {
    this.sessions.delete(id);
  }

  async count(): Promise<number> {
    this.pruneExpired();
    return this.sessions.size;
  }
}

// ── Redis Implementation ─────────────────────────────────────────

const REDIS_KEY_PREFIX = "session:";
const REDIS_TTL_SECONDS = 4 * 60 * 60; // 4 hours

export class RedisSessionStore implements SessionStore {
  async get(id: string): Promise<PairingSession | null> {
    const redis = getRedis();
    if (!redis) return null;

    const data = await redis.get(`${REDIS_KEY_PREFIX}${id}`);
    if (!data) return null;

    return JSON.parse(data) as PairingSession;
  }

  async create(session: PairingSession): Promise<void> {
    const redis = getRedis();
    if (!redis) return;

    await redis.set(
      `${REDIS_KEY_PREFIX}${session.id}`,
      JSON.stringify(session),
      "EX",
      REDIS_TTL_SECONDS,
    );
  }

  async update(session: PairingSession): Promise<void> {
    const redis = getRedis();
    if (!redis) return;

    // Preserve existing TTL by using KEEPTTL
    await redis.set(
      `${REDIS_KEY_PREFIX}${session.id}`,
      JSON.stringify(session),
      "KEEPTTL",
    );
  }

  async delete(id: string): Promise<void> {
    const redis = getRedis();
    if (!redis) return;

    await redis.del(`${REDIS_KEY_PREFIX}${id}`);
  }

  async count(): Promise<number> {
    const redis = getRedis();
    if (!redis) return 0;

    const keys = await redis.keys(`${REDIS_KEY_PREFIX}*`);
    return keys.length;
  }
}

// ── Factory ──────────────────────────────────────────────────────

export function createSessionStore(): SessionStore {
  if (getRedis()) {
    console.log("[pairing] using Redis session store");
    return new RedisSessionStore();
  }
  console.log("[pairing] using in-memory session store");
  return new InMemorySessionStore();
}
