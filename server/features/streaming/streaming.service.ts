import ytdl from "@distube/ytdl-core";

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
 * Extract a playable stream URL for a YouTube video.
 * Prefers combined (video+audio) mp4 formats for AVPlayer compatibility.
 */
export async function getStreamInfo(videoId: string): Promise<StreamInfo> {
  cleanExpired();

  const cached = cache.get(videoId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.info;
  }

  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const info = await ytdl.getInfo(url);

  // Prefer combined formats (video+audio in one stream) for AVPlayer
  // AVPlayer handles mp4 best; fall back to highest quality available
  // Filter strictly: must have audio codec (not just hasAudio flag)
  const hasRealAudio = (f: (typeof info.formats)[0]) =>
    f.hasAudio && f.audioBitrate && f.audioBitrate > 0;

  const combinedFormats = info.formats.filter(
    (f) => f.hasVideo && hasRealAudio(f) && f.container === "mp4"
  );

  let chosen = combinedFormats.sort(
    (a, b) => (b.height ?? 0) - (a.height ?? 0)
  )[0];

  // Last resort: any format with real audio
  if (!chosen) {
    chosen = info.formats
      .filter((f) => f.hasVideo && hasRealAudio(f))
      .sort((a, b) => (b.height ?? 0) - (a.height ?? 0))[0];
  }

  if (!chosen || !chosen.url) {
    console.error(
      `[streaming] No playable format for ${videoId}. Available formats:`,
      info.formats.map((f) => ({
        itag: f.itag,
        container: f.container,
        hasVideo: f.hasVideo,
        hasAudio: f.hasAudio,
        audioBitrate: f.audioBitrate,
        mimeType: f.mimeType,
        quality: f.qualityLabel,
      }))
    );
    throw new Error("No playable stream found for this video");
  }

  console.log(
    `[streaming] ${videoId}: selected itag=${chosen.itag} ${chosen.container} ${chosen.qualityLabel ?? chosen.height + "p"} audio=${chosen.audioBitrate}kbps`
  );

  const expiresAt = Date.now() + CACHE_TTL_MS;
  const streamInfo: StreamInfo = {
    url: chosen.url,
    mimeType: chosen.mimeType ?? "video/mp4",
    quality: chosen.qualityLabel ?? `${chosen.height ?? "unknown"}p`,
    expiresAt,
  };

  cache.set(videoId, { info: streamInfo, expiresAt });

  return streamInfo;
}
