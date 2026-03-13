import type { Express } from "express";
import { storage } from "../../storage";
import { LalalAIService } from "./lalalai.service";
import { GaudioStudioService } from "./gaudio.service";

export function registerVocalSeparationRoutes(app: Express) {
  // Process vocal separation for a song
  app.post("/api/songs/:id/separate-vocals", async (req, res) => {
    try {
      const song = await storage.getSong(req.params.id);
      if (!song) {
        return res.status(404).json({ error: "Song not found" });
      }

      if (song.lalalJobId && song.instrumentalUrl) {
        return res.json({
          status: 'completed',
          instrumentalUrl: song.instrumentalUrl,
          message: 'Vocal separation already complete'
        });
      }

      if (song.lalalJobId) {
        return res.json({
          status: 'processing',
          jobId: song.lalalJobId,
          message: 'Vocal separation in progress'
        });
      }

      const lalalService = new LalalAIService();
      const audioUrl = `https://www.youtube.com/watch?v=${song.videoId}`;

      const fileId = await lalalService.processVocalSeparation(
        audioUrl,
        `${song.title.replace(/[^a-z0-9]/gi, '_')}.mp3`
      );

      await storage.updateSong(req.params.id, { lalalJobId: fileId });

      res.json({
        status: 'processing',
        jobId: fileId,
        message: 'Vocal separation started'
      });
    } catch (error: any) {
      console.error("Vocal separation error:", error);
      res.status(500).json({ error: error.message || "Failed to start vocal separation" });
    }
  });

  // Check vocal separation status
  app.get("/api/songs/:id/separation-status", async (req, res) => {
    try {
      const song = await storage.getSong(req.params.id);
      if (!song) {
        return res.status(404).json({ error: "Song not found" });
      }

      if (!song.lalalJobId) {
        return res.json({ status: 'not_started' });
      }

      if (song.instrumentalUrl) {
        return res.json({
          status: 'completed',
          instrumentalUrl: song.instrumentalUrl
        });
      }

      const lalalService = new LalalAIService();
      const instrumentalUrl = await lalalService.getInstrumentalUrl(song.lalalJobId);

      if (instrumentalUrl) {
        await storage.updateSong(req.params.id, { instrumentalUrl });
        return res.json({
          status: 'completed',
          instrumentalUrl
        });
      }

      res.json({ status: 'processing' });
    } catch (error: any) {
      console.error("Check separation status error:", error);
      res.status(500).json({ error: error.message || "Failed to check separation status" });
    }
  });

  // Gaudio Studio vocal separation routes
  app.post("/api/songs/:id/gaudio-separate", async (req, res) => {
    try {
      const song = await storage.getSong(req.params.id);
      if (!song) {
        return res.status(404).json({ error: "Song not found" });
      }

      // Check if already processed with Gaudio
      if (song.gaudioJobId && song.instrumentalUrl) {
        return res.json({
          status: 'completed',
          instrumentalUrl: song.instrumentalUrl,
          message: 'Vocal separation already complete (Gaudio Studio)'
        });
      }

      // Check if job is in progress
      if (song.gaudioJobId) {
        return res.json({
          status: 'processing',
          jobId: song.gaudioJobId,
          message: 'Vocal separation in progress (Gaudio Studio)'
        });
      }

      // NOTE: Gaudio API limitation - YouTube URLs not yet supported
      // The API currently only accepts audioUploadId from uploaded files
      // Cannot legally download YouTube audio per YouTube ToS
      // This feature will work once Gaudio adds YouTube URL support to their API
      return res.status(400).json({
        error: "Gaudio API doesn't support YouTube URLs yet. This feature will be available when Gaudio adds YouTube URL support to their API (currently only available in their web app)."
      });
    } catch (error: any) {
      console.error("Gaudio vocal separation error:", error);
      res.status(500).json({ error: error.message || "Failed to start vocal separation with Gaudio" });
    }
  });

  // Check Gaudio separation status
  app.get("/api/songs/:id/gaudio-status", async (req, res) => {
    try {
      const song = await storage.getSong(req.params.id);
      if (!song) {
        return res.status(404).json({ error: "Song not found" });
      }

      if (!song.gaudioJobId) {
        return res.json({ status: 'not_started' });
      }

      if (song.instrumentalUrl) {
        return res.json({
          status: 'completed',
          instrumentalUrl: song.instrumentalUrl
        });
      }

      const gaudioService = new GaudioStudioService();
      const instrumentalUrl = await gaudioService.getInstrumentalUrl(song.gaudioJobId);

      if (instrumentalUrl) {
        await storage.updateSong(req.params.id, { instrumentalUrl });
        return res.json({
          status: 'completed',
          instrumentalUrl
        });
      }

      res.json({ status: 'processing' });
    } catch (error: any) {
      console.error("Check Gaudio status error:", error);
      res.status(500).json({ error: error.message || "Failed to check Gaudio separation status" });
    }
  });
}
