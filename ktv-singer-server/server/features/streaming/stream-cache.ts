import type { StreamInfo } from "./streaming.service";
import { getRedis } from "../../redis";

// ── Interface ────────────────────────────────────────────────────

export interface StreamCache {
  get(videoId: string): Promise<StreamInfo | null>;
  set(videoId: string, info: StreamInfo, ttlMs: number): Promise<void>;
}

// ── In-Memory Implementation ─────────────────────────────────────

export class InMemoryStreamCache implements StreamCache {
  private cache = new Map<string, { info: StreamInfo; expiresAt: number }>();

  private cleanExpired() {
    const now = Date.now();
    const expired: string[] = [];
    this.cache.forEach((entry, key) => {
      if (entry.expiresAt <= now) {
        expired.push(key);
      }
    });
    expired.forEach((key) => this.cache.delete(key));
  }

  async get(videoId: string): Promise<StreamInfo | null> {
    this.cleanExpired();
    const entry = this.cache.get(videoId);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.info;
    }
    return null;
  }

  async set(videoId: string, info: StreamInfo, ttlMs: number): Promise<void> {
    this.cache.set(videoId, { info, expiresAt: Date.now() + ttlMs });
  }
}

// ── Redis Implementation ─────────────────────────────────────────

const REDIS_KEY_PREFIX = "stream:";

export class RedisStreamCache implements StreamCache {
  async get(videoId: string): Promise<StreamInfo | null> {
    const redis = getRedis();
    if (!redis) return null;

    const data = await redis.get(`${REDIS_KEY_PREFIX}${videoId}`);
    if (!data) return null;

    return JSON.parse(data) as StreamInfo;
  }

  async set(videoId: string, info: StreamInfo, ttlMs: number): Promise<void> {
    const redis = getRedis();
    if (!redis) return;

    await redis.set(
      `${REDIS_KEY_PREFIX}${videoId}`,
      JSON.stringify(info),
      "PX",
      ttlMs,
    );
  }
}

// ── Factory ──────────────────────────────────────────────────────

export function createStreamCache(): StreamCache {
  if (getRedis()) {
    console.log("[streaming] using Redis stream cache");
    return new RedisStreamCache();
  }
  console.log("[streaming] using in-memory stream cache");
  return new InMemoryStreamCache();
}
