import type { Express } from "express";
import { storage } from "../../storage";
import { isAuthenticated } from "../../middleware";

export function registerPlaysRoutes(app: Express) {
  // Get user's play counts
  app.get('/api/user/plays', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const plays = await storage.getUserSongPlays(userId);
      res.json(plays);
    } catch (error) {
      console.error("Error fetching user plays:", error);
      res.status(500).json({ error: "Failed to fetch play counts" });
    }
  });

  // Increment play count (global + user-specific if logged in)
  app.post("/api/songs/:id/play", async (req: any, res) => {
    try {
      // Increment global play count
      const song = await storage.incrementPlayCount(req.params.id);
      if (!song) {
        return res.status(404).json({ error: "Song not found" });
      }

      // If user is authenticated, also track user-specific play count
      if (req.isAuthenticated && req.user?.claims?.sub) {
        const userId = req.user.claims.sub;
        await storage.incrementUserSongPlay(userId, req.params.id);
      }

      res.json(song);
    } catch (error) {
      console.error("Increment play count error:", error);
      res.status(500).json({ error: "Failed to increment play count" });
    }
  });
}
