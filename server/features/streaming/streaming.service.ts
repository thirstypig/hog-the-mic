import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export interface StreamInfo {
  url: string;
  mimeType: string;
  quality: string;
  expiresAt: number;
}

// In-memory cache: videoId → { info, expiresAt }
const cache = new Map<string, { info: StreamInfo; expiresAt: number }>();
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours (YouTube URLs expire ~6hrs)

function cleanExpired() {
  const now = Date.now();
  cache.forEach((entry, key) => {
    if (entry.expiresAt <= now) {
      cache.delete(key);
    }
  });
}

/**
 * Extract a playable stream URL for a YouTube video using yt-dlp.
 * Prefers combined (video+audio) mp4 formats for AVPlayer compatibility.
 */
export async function getStreamInfo(videoId: string): Promise<StreamInfo> {
  cleanExpired();

  const cached = cache.get(videoId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.info;
  }

  const url = `https://www.youtube.com/watch?v=${videoId}`;

  // Use yt-dlp to get the best combined mp4 stream URL
  // -f: format selection — best mp4 with video+audio combined
  // -g: print URL only
  // -j: print JSON info (we use --print to get specific fields)
  try {
    // First try: best combined mp4
    const { stdout } = await execFileAsync("yt-dlp", [
      "-f", "best[ext=mp4]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best",
      "--get-url",
      "--no-warnings",
      "--no-check-certificates",
      url,
    ], { timeout: 30000 });

    const streamUrl = stdout.trim().split("\n")[0];
    if (!streamUrl) {
      throw new Error("yt-dlp returned empty URL");
    }

    // Get format info for logging
    let quality = "unknown";
    try {
      const { stdout: infoJson } = await execFileAsync("yt-dlp", [
        "-f", "best[ext=mp4]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best",
        "--dump-json",
        "--no-warnings",
        "--no-check-certificates",
        url,
      ], { timeout: 30000 });

      const info = JSON.parse(infoJson);
      quality = info.resolution || info.format_note || `${info.height || "unknown"}p`;
      console.log(
        `[streaming] ${videoId}: yt-dlp selected format=${info.format_id} ${info.ext} ${quality} vcodec=${info.vcodec} acodec=${info.acodec}`
      );
    } catch {
      // Non-critical — we already have the URL
      console.log(`[streaming] ${videoId}: got URL, format info unavailable`);
    }

    const expiresAt = Date.now() + CACHE_TTL_MS;
    const streamInfo: StreamInfo = {
      url: streamUrl,
      mimeType: "video/mp4",
      quality,
      expiresAt,
    };

    cache.set(videoId, { info: streamInfo, expiresAt });
    return streamInfo;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[streaming] yt-dlp failed for ${videoId}:`, message);
    throw new Error(`Failed to extract stream: ${message}`);
  }
}
