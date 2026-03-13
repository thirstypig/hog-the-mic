import { performances, type Performance, type InsertPerformance } from "@shared/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";

export async function createPerformance(insertPerformance: InsertPerformance): Promise<Performance> {
  const [performance] = await db.insert(performances).values(insertPerformance).returning();
  return performance;
}

export async function getPerformancesBySongId(songId: string): Promise<Performance[]> {
  return await db.select().from(performances).where(eq(performances.songId, songId));
}

export async function getUserPerformances(userId: string): Promise<Performance[]> {
  return await db.select().from(performances).where(eq(performances.userId, userId));
}
