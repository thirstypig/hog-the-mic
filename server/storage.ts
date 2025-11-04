import {
  users,
  songs,
  performances,
  userSongPlays,
  playlists,
  playlistSongs,
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
  type InsertPlaylistSong,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - Required for Replit Auth
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
  // User operations - Required for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Song operations
  async getSong(id: string): Promise<Song | undefined> {
    const [song] = await db.select().from(songs).where(eq(songs.id, id));
    return song;
  }

  async getSongByVideoId(videoId: string): Promise<Song | undefined> {
    const [song] = await db.select().from(songs).where(eq(songs.videoId, videoId));
    return song;
  }

  async getAllSongs(): Promise<Song[]> {
    return await db.select().from(songs);
  }

  async createSong(insertSong: InsertSong): Promise<Song> {
    const [song] = await db.insert(songs).values(insertSong).returning();
    return song;
  }

  async updateSong(id: string, updates: Partial<InsertSong>): Promise<Song | undefined> {
    const [song] = await db
      .update(songs)
      .set(updates)
      .where(eq(songs.id, id))
      .returning();
    return song;
  }

  async incrementPlayCount(id: string): Promise<Song | undefined> {
    const [song] = await db
      .update(songs)
      .set({ playCount: sql`${songs.playCount} + 1` })
      .where(eq(songs.id, id))
      .returning();
    return song;
  }

  // User-specific play tracking
  async incrementUserSongPlay(userId: string, songId: string): Promise<UserSongPlay> {
    // Try to update existing record
    const [updated] = await db
      .update(userSongPlays)
      .set({
        playCount: sql`${userSongPlays.playCount} + 1`,
        lastPlayedAt: new Date(),
      })
      .where(and(eq(userSongPlays.userId, userId), eq(userSongPlays.songId, songId)))
      .returning();

    if (updated) {
      return updated;
    }

    // Create new record if doesn't exist
    const [created] = await db
      .insert(userSongPlays)
      .values({ userId, songId, playCount: 1 })
      .returning();
    return created;
  }

  async getUserSongPlay(userId: string, songId: string): Promise<UserSongPlay | undefined> {
    const [play] = await db
      .select()
      .from(userSongPlays)
      .where(and(eq(userSongPlays.userId, userId), eq(userSongPlays.songId, songId)));
    return play;
  }

  async getUserSongPlays(userId: string): Promise<UserSongPlay[]> {
    return await db
      .select()
      .from(userSongPlays)
      .where(eq(userSongPlays.userId, userId));
  }

  // Performance operations
  async createPerformance(insertPerformance: InsertPerformance): Promise<Performance> {
    const [performance] = await db.insert(performances).values(insertPerformance).returning();
    return performance;
  }

  async getPerformancesBySongId(songId: string): Promise<Performance[]> {
    return await db.select().from(performances).where(eq(performances.songId, songId));
  }

  async getUserPerformances(userId: string): Promise<Performance[]> {
    return await db.select().from(performances).where(eq(performances.userId, userId));
  }

  // Playlist operations
  async createPlaylist(insertPlaylist: InsertPlaylist): Promise<Playlist> {
    const [playlist] = await db.insert(playlists).values(insertPlaylist).returning();
    return playlist;
  }

  async getUserPlaylists(userId: string): Promise<Playlist[]> {
    return await db.select().from(playlists).where(eq(playlists.userId, userId));
  }

  async getPlaylist(id: string): Promise<Playlist | undefined> {
    const [playlist] = await db.select().from(playlists).where(eq(playlists.id, id));
    return playlist;
  }

  async updatePlaylist(id: string, updates: Partial<InsertPlaylist>): Promise<Playlist | undefined> {
    const [playlist] = await db
      .update(playlists)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(playlists.id, id))
      .returning();
    return playlist;
  }

  async deletePlaylist(id: string): Promise<void> {
    await db.delete(playlists).where(eq(playlists.id, id));
  }

  // Playlist song operations
  async addSongToPlaylist(playlistId: string, songId: string, position: number): Promise<PlaylistSong> {
    const [playlistSong] = await db
      .insert(playlistSongs)
      .values({ playlistId, songId, position })
      .returning();
    return playlistSong;
  }

  async removeSongFromPlaylist(playlistId: string, songId: string): Promise<void> {
    await db.delete(playlistSongs).where(
      and(eq(playlistSongs.playlistId, playlistId), eq(playlistSongs.songId, songId))
    );
  }

  async getPlaylistSongs(playlistId: string): Promise<PlaylistSong[]> {
    return await db
      .select()
      .from(playlistSongs)
      .where(eq(playlistSongs.playlistId, playlistId))
      .orderBy(playlistSongs.position);
  }

  async reorderPlaylistSongs(
    playlistId: string,
    songPositions: { songId: string; position: number }[]
  ): Promise<void> {
    // Update positions for each song
    for (const { songId, position } of songPositions) {
      await db
        .update(playlistSongs)
        .set({ position })
        .where(
          and(eq(playlistSongs.playlistId, playlistId), eq(playlistSongs.songId, songId))
        );
    }
  }
}

export const storage = new DatabaseStorage();
