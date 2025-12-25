'use server'

import { db } from "@/lib/db";
import { questHistory } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";

export async function getRecentQuests(userId: string, limit: number = 30) {
    const result = await db
        .select()
        .from(questHistory)
        .where(eq(questHistory.userId, userId))
        .orderBy(desc(questHistory.generatedAt))
        .limit(limit);
  
    return result.map(q => ({
        title: q.title,
        task: q.task,
        type: q.questType,
    }));
}

export async function saveQuestsToHistory(userId: string, quests: { title: string; task: string; type: string }[]) {
    if (quests.length === 0) return;
  
    await db.insert(questHistory).values(
        quests.map(q => ({
            userId: userId,
            title: q.title,
            task: q.task,
            questType: q.type,
        }))
    );
}
