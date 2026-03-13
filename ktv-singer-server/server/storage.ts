import {
  type User,
  type UpsertUser,
  type Song,
  type InsertSong,
  type Performance,
  type InsertPerformance,
  type UserSongPlay,
  type Playlist,
  type InsertPlaylist,
  type PlaylistSong,
} from "@shared/schema";

// Feature storage imports — always import through barrel exports
import * as authStorage from "./features/auth";
import * as songsStorage from "./features/songs";
import * as scoringStorage from "./features/scoring";
import * as playlistStorage from "./features/playlist";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Song operations
  getSong(id: string): Promise<Song | undefined>;
  getSongByVideoId(videoId: string): Promise<Song | undefined>;
  getAllSongs(): Promise<Song[]>;
  createSong(song: InsertSong): Promise<Song>;
  updateSong(id: string, updates: Partial<InsertSong>): Promise<Song | undefined>;
  incrementPlayCount(id: string): Promise<Song | undefined>;

  // User-specific play tracking
  incrementUserSongPlay(userId: string, songId: string): Promise<UserSongPlay>;
  getUserSongPlay(userId: string, songId: string): Promise<UserSongPlay | undefined>;
  getUserSongPlays(userId: string): Promise<UserSongPlay[]>;

  // Performance operations
  createPerformance(performance: InsertPerformance): Promise<Performance>;
  getPerformancesBySongId(songId: string): Promise<Performance[]>;
  getUserPerformances(userId: string): Promise<Performance[]>;

  // Playlist operations
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;
  getUserPlaylists(userId: string): Promise<Playlist[]>;
  getPlaylist(id: string): Promise<Playlist | undefined>;
  updatePlaylist(id: string, updates: Partial<InsertPlaylist>): Promise<Playlist | undefined>;
  deletePlaylist(id: string): Promise<void>;

  // Playlist song operations
  addSongToPlaylist(playlistId: string, songId: string, position: number): Promise<PlaylistSong>;
  removeSongFromPlaylist(playlistId: string, songId: string): Promise<void>;
  getPlaylistSongs(playlistId: string): Promise<PlaylistSong[]>;
  reorderPlaylistSongs(playlistId: string, songPositions: { songId: string; position: number }[]): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations — delegate to auth feature
  async getUser(id: string): Promise<User | undefined> {
    return authStorage.getUser(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    return authStorage.upsertUser(userData);
  }

  // Song operations — delegate to songs feature
  async getSong(id: string): Promise<Song | undefined> {
    return songsStorage.getSong(id);
  }

  async getSongByVideoId(videoId: string): Promise<Song | undefined> {
    return songsStorage.getSongByVideoId(videoId);
  }

  async getAllSongs(): Promise<Song[]> {
    return songsStorage.getAllSongs();
  }

  async createSong(insertSong: InsertSong): Promise<Song> {
    return songsStorage.createSong(insertSong);
  }

  async updateSong(id: string, updates: Partial<InsertSong>): Promise<Song | undefined> {
    return songsStorage.updateSong(id, updates);
  }

  async incrementPlayCount(id: string): Promise<Song | undefined> {
    return songsStorage.incrementPlayCount(id);
  }

  // User-specific play tracking — delegate to scoring feature
  async incrementUserSongPlay(userId: string, songId: string): Promise<UserSongPlay> {
    return scoringStorage.incrementUserSongPlay(userId, songId);
  }

  async getUserSongPlay(userId: string, songId: string): Promise<UserSongPlay | undefined> {
    return scoringStorage.getUserSongPlay(userId, songId);
  }

  async getUserSongPlays(userId: string): Promise<UserSongPlay[]> {
    return scoringStorage.getUserSongPlays(userId);
  }

  // Performance operations — delegate to scoring feature
  async createPerformance(insertPerformance: InsertPerformance): Promise<Performance> {
    return scoringStorage.createPerformance(insertPerformance);
  }

  async getPerformancesBySongId(songId: string): Promise<Performance[]> {
    return scoringStorage.getPerformancesBySongId(songId);
  }

  async getUserPerformances(userId: string): Promise<Performance[]> {
    return scoringStorage.getUserPerformances(userId);
  }

  // Playlist operations — delegate to playlist feature
  async createPlaylist(insertPlaylist: InsertPlaylist): Promise<Playlist> {
    return playlistStorage.createPlaylist(insertPlaylist);
  }

  async getUserPlaylists(userId: string): Promise<Playlist[]> {
    return playlistStorage.getUserPlaylists(userId);
  }

  async getPlaylist(id: string): Promise<Playlist | undefined> {
    return playlistStorage.getPlaylist(id);
  }

  async updatePlaylist(id: string, updates: Partial<InsertPlaylist>): Promise<Playlist | undefined> {
    return playlistStorage.updatePlaylist(id, updates);
  }

  async deletePlaylist(id: string): Promise<void> {
    return playlistStorage.deletePlaylist(id);
  }

  // Playlist song operations — delegate to playlist feature
  async addSongToPlaylist(playlistId: string, songId: string, position: number): Promise<PlaylistSong> {
    return playlistStorage.addSongToPlaylist(playlistId, songId, position);
  }

  async removeSongFromPlaylist(playlistId: string, songId: string): Promise<void> {
    return playlistStorage.removeSongFromPlaylist(playlistId, songId);
  }

  async getPlaylistSongs(playlistId: string): Promise<PlaylistSong[]> {
    return playlistStorage.getPlaylistSongs(playlistId);
  }

  async reorderPlaylistSongs(
    playlistId: string,
    songPositions: { songId: string; position: number }[]
  ): Promise<void> {
    return playlistStorage.reorderPlaylistSongs(playlistId, songPositions);
  }
}

export const storage = new DatabaseStorage();
