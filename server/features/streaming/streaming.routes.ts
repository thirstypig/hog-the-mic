import type { Express } from "express";
import { getStreamInfo } from "./streaming.service";

export function registerStreamingRoutes(app: Express) {
  // GET /api/youtube/stream/:videoId
  // Returns a playable stream URL for the given YouTube video
  app.get("/api/youtube/stream/:videoId", async (req, res) => {
    try {
      const { videoId } = req.params;

      if (!videoId || videoId.length < 5 || videoId.length > 20) {
        return res.status(400).json({ error: "Invalid video ID" });
      }

      const streamInfo = await getStreamInfo(videoId);
      res.json(streamInfo);
    } catch (error) {
      console.error("Stream extraction error:", error);
      const message =
        error instanceof Error ? error.message : "Failed to extract stream";
      res.status(500).json({ error: message });
    }
  });
}
