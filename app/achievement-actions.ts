'use server'

import { db } from "@/lib/db";
import { achievements } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getAchievements(userId: string) {
    const result = await db.select()
        .from(achievements)
        .where(eq(achievements.userId, userId))
        .orderBy(desc(achievements.lastEarned));
  
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

export async function saveAchievement(userId: string, achievement: {
  id: string;
  title: string;
  description: string;
  emoji: string;
  xp: number;
}) {
    const existing = await db
        .select()
        .from(achievements)
        .where(and(
            eq(achievements.uniqueId, achievement.id),
            eq(achievements.userId, userId)
        ));

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
            userId: userId,
            uniqueId: achievement.id,
            title: achievement.title,
            description: achievement.description,
            emoji: achievement.emoji,
            xp: achievement.xp,
            count: 1,
            lastEarned: new Date(),
        });
    }

    return getAchievements(userId);
}

export async function incrementAchievementCount(userId: string, id: string) {
    const existing = await db
        .select()
        .from(achievements)
        .where(and(
            eq(achievements.uniqueId, id),
            eq(achievements.userId, userId)
        ));

    if (existing.length > 0) {
        await db
            .update(achievements)
            .set({
                count: existing[0].count + 1,
                lastEarned: new Date(),
            })
            .where(and(
                eq(achievements.uniqueId, id),
                eq(achievements.userId, userId)
            ));
    }

    return getAchievements(userId);
}
