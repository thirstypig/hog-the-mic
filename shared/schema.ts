import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, integer, timestamp, index, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Using Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

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

// User-specific song play tracking
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

export const performances = pgTable("performances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  songId: varchar("song_id").notNull().references(() => songs.id),
  totalScore: integer("total_score").notNull(),
  pitchScore: integer("pitch_score").notNull(),
  timingScore: integer("timing_score").notNull(),
  rhythmScore: integer("rhythm_score").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPerformanceSchema = createInsertSchema(performances).omit({
  id: true,
  createdAt: true,
});

export type InsertPerformance = z.infer<typeof insertPerformanceSchema>;
export type Performance = typeof performances.$inferSelect;

// Playlists table
export const playlists = pgTable("playlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPlaylistSchema = createInsertSchema(playlists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type Playlist = typeof playlists.$inferSelect;

// Playlist songs table (junction table with ordering)
export const playlistSongs = pgTable("playlist_songs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playlistId: varchar("playlist_id").notNull().references(() => playlists.id, { onDelete: "cascade" }),
  songId: varchar("song_id").notNull().references(() => songs.id),
  position: integer("position").notNull(), // Order within the playlist
  addedAt: timestamp("added_at").defaultNow(),
});

export const insertPlaylistSongSchema = createInsertSchema(playlistSongs).omit({
  id: true,
  addedAt: true,
});

export type InsertPlaylistSong = z.infer<typeof insertPlaylistSongSchema>;
export type PlaylistSong = typeof playlistSongs.$inferSelect;
