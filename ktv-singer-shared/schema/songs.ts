import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const songs = pgTable("songs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: text("video_id").notNull().unique(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  thumbnailUrl: text("thumbnail_url").default(sql`NULL`),
  genre: text("genre").notNull(),
  gender: text("gender").notNull(), // 'male', 'female', 'duet'
  year: integer("year").notNull(),
  lyrics: jsonb("lyrics").notNull().$type<{ time: number; text: string }[]>(),
  playCount: integer("play_count").notNull().default(0), // Global play count
  instrumentalUrl: text("instrumental_url").default(sql`NULL`),
  gaudioJobId: text("gaudio_job_id").default(sql`NULL`),
  lalalJobId: text("lalal_job_id").default(sql`NULL`),
  lyricsOffset: real("lyrics_offset").notNull().default(0), // Timing adjustment in seconds
});

export const insertSongSchema = createInsertSchema(songs).omit({
  id: true,
});

export type InsertSong = z.infer<typeof insertSongSchema>;
export type Song = typeof songs.$inferSelect;
