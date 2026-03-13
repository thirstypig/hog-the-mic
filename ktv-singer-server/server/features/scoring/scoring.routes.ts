import type { Express } from "express";
import { storage } from "../../storage";
import { isAuthenticated } from "../../middleware";
import { insertPerformanceSchema } from "@shared/schema";

export function registerScoringRoutes(app: Express) {
  // Save performance score (optionally authenticated)
  app.post("/api/performances", async (req: any, res) => {
    try {
      const validatedData = insertPerformanceSchema.parse(req.body);

      // Add user ID if authenticated
      if (req.isAuthenticated && req.user?.claims?.sub) {
        validatedData.userId = req.user.claims.sub;
      }

      const performance = await storage.createPerformance(validatedData);
      res.status(201).json(performance);
    } catch (error) {
      console.error("Create performance error:", error);
      res.status(400).json({ error: "Invalid performance data" });
    }
  });

  // Get performances for a song
  app.get("/api/performances/song/:songId", async (req, res) => {
    try {
      const performances = await storage.getPerformancesBySongId(req.params.songId);
      res.json(performances);
    } catch (error) {
      console.error("Get performances error:", error);
      res.status(500).json({ error: "Failed to get performances" });
    }
  });

  // Get user's performances
  app.get('/api/user/performances', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const performances = await storage.getUserPerformances(userId);
      res.json(performances);
    } catch (error) {
      console.error("Error fetching user performances:", error);
      res.status(500).json({ error: "Failed to fetch performances" });
    }
  });
}
