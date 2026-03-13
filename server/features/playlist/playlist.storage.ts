import {
  playlists,
  playlistSongs,
  songs,
  type Playlist,
  type InsertPlaylist,
  type PlaylistSong,
  type Song,
} from "@shared/schema";
import { db } from "../../db";
import { eq, and } from "drizzle-orm";

export async function createPlaylist(insertPlaylist: InsertPlaylist): Promise<Playlist> {
  const [playlist] = await db.insert(playlists).values(insertPlaylist).returning();
  return playlist;
}

export async function getUserPlaylists(userId: string): Promise<Playlist[]> {
  return await db.select().from(playlists).where(eq(playlists.userId, userId));
}

export async function getPlaylist(id: string): Promise<Playlist | undefined> {
  const [playlist] = await db.select().from(playlists).where(eq(playlists.id, id));
  return playlist;
}

export async function updatePlaylist(id: string, updates: Partial<InsertPlaylist>): Promise<Playlist | undefined> {
  const [playlist] = await db
    .update(playlists)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(playlists.id, id))
    .returning();
  return playlist;
}

export async function deletePlaylist(id: string): Promise<void> {
  await db.delete(playlists).where(eq(playlists.id, id));
}

export async function addSongToPlaylist(playlistId: string, songId: string, position: number): Promise<PlaylistSong> {
  const [playlistSong] = await db
    .insert(playlistSongs)
    .values({ playlistId, songId, position })
    .returning();
  return playlistSong;
}

export async function removeSongFromPlaylist(playlistId: string, songId: string): Promise<void> {
  await db.delete(playlistSongs).where(
    and(eq(playlistSongs.playlistId, playlistId), eq(playlistSongs.songId, songId))
  );
}

export async function getPlaylistSongs(playlistId: string): Promise<PlaylistSong[]> {
  return await db
    .select()
    .from(playlistSongs)
    .where(eq(playlistSongs.playlistId, playlistId))
    .orderBy(playlistSongs.position);
}

export async function getPlaylistSongsWithDetails(playlistId: string): Promise<Song[]> {
  const rows = await db
    .select({ song: songs })
    .from(playlistSongs)
    .innerJoin(songs, eq(playlistSongs.songId, songs.id))
    .where(eq(playlistSongs.playlistId, playlistId))
    .orderBy(playlistSongs.position);
  return rows.map((r) => r.song);
}

export async function reorderPlaylistSongs(
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
