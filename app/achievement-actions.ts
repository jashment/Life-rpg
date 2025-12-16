'use server'

import { db } from "@/lib/db";
import { achievements } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function getAchievements() {
  const result = await db.select().from(achievements).orderBy(achievements.lastEarned);
  return result.map(a => ({
    id: a.uniqueId,
    title: a.title,
    description: a.description,
    emoji: a.emoji,
    count: a.count,
    lastEarned: a.lastEarned.toISOString(),
    xp: a.xp,
  }));
}

export async function saveAchievement(achievement: {
  id: string;
  title: string;
  description: string;
  emoji: string;
  xp: number;
}) {
  const existing = await db
    .select()
    .from(achievements)
    .where(eq(achievements.uniqueId, achievement.id));

  if (existing.length > 0) {
    await db
      .update(achievements)
      .set({
        count: existing[0].count + 1,
        lastEarned: new Date(),
      })
      .where(eq(achievements.uniqueId, achievement.id));
  } else {
    await db.insert(achievements).values({
      uniqueId: achievement.id,
      title: achievement.title,
      description: achievement.description,
      emoji: achievement.emoji,
      xp: achievement.xp,
      count: 1,
      lastEarned: new Date(),
    });
  }

  return getAchievements();
}

export async function incrementAchievementCount(id: string) {
  const existing = await db
    .select()
    .from(achievements)
    .where(eq(achievements.uniqueId, id));

  if (existing.length > 0) {
    await db
      .update(achievements)
      .set({
        count: existing[0].count + 1,
        lastEarned: new Date(),
      })
      .where(eq(achievements.uniqueId, id));
  }

  return getAchievements();
}
