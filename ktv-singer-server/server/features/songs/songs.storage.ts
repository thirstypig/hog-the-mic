import { songs, type Song, type InsertSong } from "@shared/schema";
import { db } from "../../db";
import { eq, sql } from "drizzle-orm";

export async function getSong(id: string): Promise<Song | undefined> {
  const [song] = await db.select().from(songs).where(eq(songs.id, id));
  return song;
}

export async function getSongByVideoId(videoId: string): Promise<Song | undefined> {
  const [song] = await db.select().from(songs).where(eq(songs.videoId, videoId));
  return song;
}

export async function getAllSongs(): Promise<Song[]> {
  return await db.select().from(songs);
}

export async function createSong(insertSong: InsertSong): Promise<Song> {
  const [song] = await db.insert(songs).values(insertSong as typeof songs.$inferInsert).returning();
  return song;
}

export async function updateSong(id: string, updates: Partial<InsertSong>): Promise<Song | undefined> {
  const [song] = await db
    .update(songs)
    .set(updates as Partial<typeof songs.$inferInsert>)
    .where(eq(songs.id, id))
    .returning();
  return song;
}

export async function incrementPlayCount(id: string): Promise<Song | undefined> {
  const [song] = await db
    .update(songs)
    .set({ playCount: sql`${songs.playCount} + 1` })
    .where(eq(songs.id, id))
    .returning();
  return song;
}
