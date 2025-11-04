import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { searchYouTubeVideos, getVideoDetails, extractVideoId } from "./youtube";
import { searchLyrics, searchLRCLibDatabase } from "./lrclib";
import { LalalAIService } from "./lalalai";
import { GaudioStudioService } from "./gaudio";
import { insertSongSchema, insertPerformanceSchema, insertPlaylistSchema, insertPlaylistSongSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);

  // Auth route - get current user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

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

  // Playlist routes
  // Get all user's playlists
  app.get('/api/playlists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const playlists = await storage.getUserPlaylists(userId);
      res.json(playlists);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      res.status(500).json({ error: "Failed to fetch playlists" });
    }
  });

  // Create a new playlist
  app.post('/api/playlists', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validation = insertPlaylistSchema.safeParse({ ...req.body, userId });
      
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.message });
      }

      const playlist = await storage.createPlaylist(validation.data);
      res.status(201).json(playlist);
    } catch (error) {
      console.error("Error creating playlist:", error);
      res.status(500).json({ error: "Failed to create playlist" });
    }
  });

  // Get a specific playlist
  app.get('/api/playlists/:id', isAuthenticated, async (req: any, res) => {
    try {
      const playlist = await storage.getPlaylist(req.params.id);
      
      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }

      // Check if user owns this playlist
      if (playlist.userId !== req.user.claims.sub) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(playlist);
    } catch (error) {
      console.error("Error fetching playlist:", error);
      res.status(500).json({ error: "Failed to fetch playlist" });
    }
  });

  // Update a playlist
  app.patch('/api/playlists/:id', isAuthenticated, async (req: any, res) => {
    try {
      const playlist = await storage.getPlaylist(req.params.id);
      
      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }

      if (playlist.userId !== req.user.claims.sub) {
        return res.status(403).json({ error: "Access denied" });
      }

      const updated = await storage.updatePlaylist(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating playlist:", error);
      res.status(500).json({ error: "Failed to update playlist" });
    }
  });

  // Delete a playlist
  app.delete('/api/playlists/:id', isAuthenticated, async (req: any, res) => {
    try {
      const playlist = await storage.getPlaylist(req.params.id);
      
      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }

      if (playlist.userId !== req.user.claims.sub) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deletePlaylist(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting playlist:", error);
      res.status(500).json({ error: "Failed to delete playlist" });
    }
  });

  // Get songs in a playlist
  app.get('/api/playlists/:id/songs', isAuthenticated, async (req: any, res) => {
    try {
      const playlist = await storage.getPlaylist(req.params.id);
      
      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }

      if (playlist.userId !== req.user.claims.sub) {
        return res.status(403).json({ error: "Access denied" });
      }

      const playlistSongs = await storage.getPlaylistSongs(req.params.id);
      res.json(playlistSongs);
    } catch (error) {
      console.error("Error fetching playlist songs:", error);
      res.status(500).json({ error: "Failed to fetch playlist songs" });
    }
  });

  // Add a song to a playlist
  app.post('/api/playlists/:id/songs', isAuthenticated, async (req: any, res) => {
    try {
      const playlist = await storage.getPlaylist(req.params.id);
      
      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }

      if (playlist.userId !== req.user.claims.sub) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { songId, position } = req.body;
      const playlistSong = await storage.addSongToPlaylist(req.params.id, songId, position);
      res.status(201).json(playlistSong);
    } catch (error) {
      console.error("Error adding song to playlist:", error);
      res.status(500).json({ error: "Failed to add song to playlist" });
    }
  });

  // Remove a song from a playlist
  app.delete('/api/playlists/:id/songs/:songId', isAuthenticated, async (req: any, res) => {
    try {
      const playlist = await storage.getPlaylist(req.params.id);
      
      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }

      if (playlist.userId !== req.user.claims.sub) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.removeSongFromPlaylist(req.params.id, req.params.songId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing song from playlist:", error);
      res.status(500).json({ error: "Failed to remove song from playlist" });
    }
  });
  
  // YouTube search route
  app.get("/api/youtube/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }

      const results = await searchYouTubeVideos(query, 20);
      res.json(results);
    } catch (error) {
      console.error("YouTube search error:", error);
      res.status(500).json({ error: "Failed to search YouTube" });
    }
  });

  // Get video details from URL
  app.post("/api/youtube/video-details", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const videoId = extractVideoId(url);
      if (!videoId) {
        return res.status(400).json({ error: "Invalid YouTube URL" });
      }

      const details = await getVideoDetails(videoId);
      if (!details) {
        return res.status(404).json({ error: "Video not found" });
      }

      res.json(details);
    } catch (error) {
      console.error("Video details error:", error);
      res.status(500).json({ error: "Failed to get video details" });
    }
  });

  // Search LRCLIB database for songs with synced lyrics
  app.get("/api/lrclib/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }

      const results = await searchLRCLibDatabase(query);
      res.json(results);
    } catch (error) {
      console.error("LRCLIB search error:", error);
      res.status(500).json({ error: "Failed to search LRCLIB" });
    }
  });

  // Get synced lyrics from LRCLIB
  app.get("/api/lyrics", async (req, res) => {
    try {
      const { track, artist, duration } = req.query;
      
      if (!track || !artist) {
        return res.status(400).json({ error: "Track and artist are required" });
      }

      const durationNum = duration ? parseInt(duration as string) : undefined;
      const lyrics = await searchLyrics(track as string, artist as string, durationNum);
      
      if (!lyrics) {
        return res.status(404).json({ error: "No synced lyrics found" });
      }

      res.json(lyrics);
    } catch (error) {
      console.error("Lyrics search error:", error);
      res.status(500).json({ error: "Failed to search lyrics" });
    }
  });

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

  const httpServer = createServer(app);

  return httpServer;
}
