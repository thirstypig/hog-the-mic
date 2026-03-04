import { execFile } from "child_process";
import { promisify } from "util";
import { createStreamCache } from "./stream-cache";

const execFileAsync = promisify(execFile);

export interface StreamInfo {
  url: string;
  mimeType: string;
  quality: string;
  expiresAt: number;
}

/** Classifed yt-dlp error with an appropriate HTTP status code */
export class StreamError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = "StreamError";
  }
}

// ── Concurrency limiter ───────────────────────────────────────

const MAX_CONCURRENT = 3;
let running = 0;
const waiting: Array<() => void> = [];

async function withConcurrencyLimit<T>(fn: () => Promise<T>): Promise<T> {
  if (running >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => waiting.push(resolve));
  }
  running++;
  try {
    return await fn();
  } finally {
    running--;
    if (waiting.length > 0) {
      waiting.shift()!();
    }
  }
}

// ── Cache ─────────────────────────────────────────────────────

const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours (YouTube URLs expire ~6hrs)
const cache = createStreamCache();

// ── Error classification ──────────────────────────────────────

function classifyError(stderr: string, message: string): StreamError {
  const combined = `${stderr}\n${message}`.toLowerCase();

  if (combined.includes("video unavailable") || combined.includes("is not available")) {
    return new StreamError("Video is unavailable", 404, "VIDEO_UNAVAILABLE");
  }
  if (combined.includes("private video")) {
    return new StreamError("Video is private", 403, "VIDEO_PRIVATE");
  }
  if (combined.includes("sign in to confirm your age") || combined.includes("age-restricted")) {
    return new StreamError("Video is age-restricted", 403, "AGE_RESTRICTED");
  }
  if (combined.includes("copyright")) {
    return new StreamError("Video blocked due to copyright", 403, "COPYRIGHT_BLOCKED");
  }
  if (combined.includes("this live event will begin")) {
    return new StreamError("Video is an upcoming livestream", 400, "LIVE_NOT_STARTED");
  }
  if (combined.includes("premieres in")) {
    return new StreamError("Video has not premiered yet", 400, "NOT_PREMIERED");
  }
  if (combined.includes("timed out") || combined.includes("etimedout")) {
    return new StreamError("YouTube request timed out — try again", 504, "TIMEOUT");
  }
  if (combined.includes("http error 429") || combined.includes("too many requests")) {
    return new StreamError("YouTube rate limit — try again later", 429, "RATE_LIMITED");
  }

  return new StreamError(`Failed to extract stream: ${message}`, 500, "EXTRACTION_FAILED");
}

// ── Retry helper ──────────────────────────────────────────────

const RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1500;
const RETRYABLE_CODES = new Set(["TIMEOUT", "RATE_LIMITED", "EXTRACTION_FAILED"]);

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main export ───────────────────────────────────────────────

/**
 * Extract a playable stream URL for a YouTube video using yt-dlp.
 * Prefers combined (video+audio) mp4 formats for AVPlayer compatibility.
 * Retries transient failures up to 2 times. Limited to 3 concurrent extractions.
 */
export async function getStreamInfo(videoId: string): Promise<StreamInfo> {
  const cached = await cache.get(videoId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }

  return withConcurrencyLimit(() => extractWithRetry(videoId));
}

async function extractWithRetry(videoId: string): Promise<StreamInfo> {
  let lastError: StreamError | undefined;

  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      return await extractStream(videoId);
    } catch (error) {
      lastError =
        error instanceof StreamError
          ? error
          : classifyError("", error instanceof Error ? error.message : String(error));

      // Don't retry non-transient errors (404, 403, 400)
      if (!RETRYABLE_CODES.has(lastError.code)) {
        throw lastError;
      }

      if (attempt < RETRY_ATTEMPTS) {
        console.log(
          `[streaming] ${videoId}: attempt ${attempt} failed (${lastError.code}), retrying in ${RETRY_DELAY_MS}ms…`,
        );
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  throw lastError!;
}

async function extractStream(videoId: string): Promise<StreamInfo> {
  const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    const { stdout } = await execFileAsync(
      "yt-dlp",
      [
        "-f",
        "best[ext=mp4]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best",
        "--get-url",
        "--no-warnings",
        "--no-check-certificates",
        ytUrl,
      ],
      { timeout: 30000 },
    );

    const streamUrl = stdout.trim().split("\n")[0];
    if (!streamUrl) {
      throw new Error("yt-dlp returned empty URL");
    }

    // Get format info for logging (non-critical)
    let quality = "unknown";
    try {
      const { stdout: infoJson } = await execFileAsync(
        "yt-dlp",
        [
          "-f",
          "best[ext=mp4]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best",
          "--dump-json",
          "--no-warnings",
          "--no-check-certificates",
          ytUrl,
        ],
        { timeout: 30000 },
      );

      const info = JSON.parse(infoJson);
      quality =
        info.resolution ||
        info.format_note ||
        `${info.height || "unknown"}p`;
      console.log(
        `[streaming] ${videoId}: yt-dlp selected format=${info.format_id} ${info.ext} ${quality} vcodec=${info.vcodec} acodec=${info.acodec}`,
      );
    } catch {
      console.log(
        `[streaming] ${videoId}: got URL, format info unavailable`,
      );
    }

    const expiresAt = Date.now() + CACHE_TTL_MS;
    const streamInfo: StreamInfo = {
      url: streamUrl,
      mimeType: "video/mp4",
      quality,
      expiresAt,
    };

    await cache.set(videoId, streamInfo, CACHE_TTL_MS);
    return streamInfo;
  } catch (error: any) {
    // Already a StreamError from retry logic
    if (error instanceof StreamError) throw error;

    const stderr = error.stderr || "";
    const message = error.message || String(error);
    console.error(`[streaming] yt-dlp failed for ${videoId}:`, message);
    throw classifyError(stderr, message);
  }
}
