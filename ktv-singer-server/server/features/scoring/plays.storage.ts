import { userSongPlays, type UserSongPlay } from "@shared/schema";
import { db } from "../../db";
import { eq, and, sql } from "drizzle-orm";

export async function incrementUserSongPlay(userId: string, songId: string): Promise<UserSongPlay> {
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

export async function getUserSongPlay(userId: string, songId: string): Promise<UserSongPlay | undefined> {
  const [play] = await db
    .select()
    .from(userSongPlays)
    .where(and(eq(userSongPlays.userId, userId), eq(userSongPlays.songId, songId)));
  return play;
}

export async function getUserSongPlays(userId: string): Promise<UserSongPlay[]> {
  return await db
    .select()
    .from(userSongPlays)
    .where(eq(userSongPlays.userId, userId));
}
