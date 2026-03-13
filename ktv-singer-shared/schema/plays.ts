import { sql } from "drizzle-orm";
import { pgTable, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";
import { songs } from "./songs";

export const userSongPlays = pgTable("user_song_plays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  songId: varchar("song_id").notNull().references(() => songs.id),
  playCount: integer("play_count").notNull().default(0),
  lastPlayedAt: timestamp("last_played_at").defaultNow(),
});

export const insertUserSongPlaySchema = createInsertSchema(userSongPlays).omit({
  id: true,
  lastPlayedAt: true,
});

export type InsertUserSongPlay = z.infer<typeof insertUserSongPlaySchema>;
export type UserSongPlay = typeof userSongPlays.$inferSelect;
