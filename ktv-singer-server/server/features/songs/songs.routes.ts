import type { Express } from "express";
import { storage } from "../../storage";
import { insertSongSchema } from "@shared/schema";

export function registerSongsRoutes(app: Express) {
  // Get all songs
  app.get("/api/songs", async (req, res) => {
    try {
      const songs = await storage.getAllSongs();
      res.json(songs);
    } catch (error) {
      console.error("Get songs error:", error);
      res.status(500).json({ error: "Failed to get songs" });
    }
  });

  // Get song by ID
  app.get("/api/songs/:id", async (req, res) => {
    try {
      const song = await storage.getSong(req.params.id);
      if (!song) {
        return res.status(404).json({ error: "Song not found" });
      }
      res.json(song);
    } catch (error) {
      console.error("Get song error:", error);
      res.status(500).json({ error: "Failed to get song" });
    }
  });

  // Get song by video ID
  app.get("/api/songs/video/:videoId", async (req, res) => {
    try {
      const song = await storage.getSongByVideoId(req.params.videoId);
      if (!song) {
        return res.status(404).json({ error: "Song not found" });
      }
      res.json(song);
    } catch (error) {
      console.error("Get song by video ID error:", error);
      res.status(500).json({ error: "Failed to get song" });
    }
  });

  // Create new song
  app.post("/api/songs", async (req, res) => {
    try {
      const validatedData = insertSongSchema.parse(req.body);
      const song = await storage.createSong(validatedData);
      res.status(201).json(song);
    } catch (error) {
      console.error("Create song error:", error);
      res.status(400).json({ error: "Invalid song data" });
    }
  });

  // Update song (e.g., save lyrics)
  app.patch("/api/songs/:id", async (req, res) => {
    try {
      const song = await storage.updateSong(req.params.id, req.body);
      if (!song) {
        return res.status(404).json({ error: "Song not found" });
      }
      res.json(song);
    } catch (error) {
      console.error("Update song error:", error);
      res.status(500).json({ error: "Failed to update song" });
    }
  });

  // Update lyrics offset for a song
  app.patch("/api/songs/:id/lyrics-offset", async (req, res) => {
    try {
      const { offset } = req.body;
      if (typeof offset !== 'number' || offset < -20 || offset > 20) {
        return res.status(400).json({ error: "Invalid offset value" });
      }

      const song = await storage.updateSong(req.params.id, { lyricsOffset: offset });
      if (!song) {
        return res.status(404).json({ error: "Song not found" });
      }
      res.json(song);
    } catch (error) {
      console.error("Update lyrics offset error:", error);
      res.status(500).json({ error: "Failed to update lyrics offset" });
    }
  });
}
