import type { Express } from "express";
import { getStreamInfo, StreamError } from "./streaming.service";

export function registerStreamingRoutes(app: Express) {
  // GET /api/youtube/stream/:videoId
  // Returns a playable stream URL for the given YouTube video
  app.get("/api/youtube/stream/:videoId", async (req, res) => {
    try {
      const { videoId } = req.params;

      if (!videoId || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{4,19}$/.test(videoId)) {
        return res.status(400).json({ error: "Invalid video ID" });
      }

      const streamInfo = await getStreamInfo(videoId);
      res.json(streamInfo);
    } catch (error) {
      if (error instanceof StreamError) {
        console.error(
          `[streaming] ${req.params.videoId}: ${error.code} — ${error.message}`,
        );
        res
          .status(error.statusCode)
          .json({ error: error.message, code: error.code });
      } else {
        console.error("Stream extraction error:", error);
        const message =
          error instanceof Error ? error.message : "Failed to extract stream";
        res.status(500).json({ error: message, code: "UNKNOWN" });
      }
    }
  });
}
