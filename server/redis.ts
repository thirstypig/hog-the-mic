import Redis from "ioredis";

let redis: Redis | null = null;

/**
 * Initialize Redis connection from REDIS_URL env var.
 * Returns null if REDIS_URL is not set (in-memory fallback for local dev).
 */
export function initRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.log("[redis] REDIS_URL not set — using in-memory stores");
    return null;
  }

  redis = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 3 });

  redis.on("connect", () => console.log("[redis] connected"));
  redis.on("error", (err) => console.error("[redis] error:", err.message));

  redis.connect().catch((err) => {
    console.error("[redis] failed to connect:", err.message);
    redis = null;
  });

  return redis;
}

/** Get the current Redis client (null if not configured) */
export function getRedis(): Redis | null {
  return redis;
}

/** Graceful shutdown */
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    console.log("[redis] connection closed");
  }
}
