import type { Express } from "express";
import { storage } from "../../storage";
import { isAuthenticated } from "../../middleware";
import { insertPlaylistSchema } from "@shared/schema";
import { getPlaylistSongsWithDetails } from "./playlist.storage";

export function registerPlaylistRoutes(app: Express) {
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

  // Get full song details for a playlist (for queue bulk-add)
  app.get('/api/playlists/:id/songs/details', isAuthenticated, async (req: any, res) => {
    try {
      const playlist = await storage.getPlaylist(req.params.id);

      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }

      if (playlist.userId !== req.user.claims.sub) {
        return res.status(403).json({ error: "Access denied" });
      }

      const songs = await getPlaylistSongsWithDetails(req.params.id);
      res.json(songs);
    } catch (error) {
      console.error("Error fetching playlist song details:", error);
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
}
