'use server'

import { db } from "@/lib/db";
import { questHistory } from "@/lib/schema";
import { desc } from "drizzle-orm";

export async function getRecentQuests(limit: number = 30) {
  const result = await db
    .select()
    .from(questHistory)
    .orderBy(desc(questHistory.generatedAt))
    .limit(limit);
  
  return result.map(q => ({
    title: q.title,
    task: q.task,
    type: q.questType,
  }));
}

export async function saveQuestsToHistory(quests: { title: string; task: string; type: string }[]) {
  if (quests.length === 0) return;
  
  await db.insert(questHistory).values(
    quests.map(q => ({
      title: q.title,
      task: q.task,
      questType: q.type,
    }))
  );
}
