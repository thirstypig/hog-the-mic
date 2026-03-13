import { sql } from "drizzle-orm";
import { pgTable, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";
import { songs } from "./songs";

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
