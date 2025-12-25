'use server'

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Achievement } from "./types";
import { getRecentQuests } from "./quest-history-actions";
import { generateAIContent } from "./ai-service";
import { items, skills, bosses, achievements, questHistory } from "@/lib/schema";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function processLog(userLog: string, currentAchievements: Achievement[]) {
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        console.error("❌ ERROR: No API Key found in .env.local");
        return { type: "ERROR", message: "API Key Missing" };
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            You are the Game Master of a Life RPG. 
            The user submitted a new log: "${userLog}".
                                                      
            Here is the player's existing Achievement List (JSON):${JSON.stringify(currentAchievements)}
                                                                        
            TASK:
            1. Analyze the difficulty of the deed (1-5 scale).
            2. Check if this log fits vaguely into an existing achievement category.
            3. IF MATCH: Return the ID.
            4. IF NEW: Create a witty title, description, emoji, and assign XP (Difficulty * 10).
                                          
            RETURN JSON ONLY. Format:
            {
                "type": "MATCH" | "NEW",
                "id": "existing-id-if-match",
                "newAchievement": {
                    "title": "Epic Title",
                    "description": "Short description",
                    "emoji": "🔥",
                    "xp": 30
                }
            }
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, "").trim();

        return JSON.parse(text);

    } catch (error) {
        console.error("🔥 AI Crash:", error);
        return { type: "ERROR" }; // Prevents 502
    }
}

export async function generateDailyQuests(userId: string) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return { type: "ERROR", message: "No API Key" };

    try {
        const recentQuests = await getRecentQuests(userId, 30);

        const themes = [
            "Barbarian (Physical Strength)", 
            "Bard (Social & Performance)", 
            "Wizard (Intellectual & Learning)", 
            "Rogue (Stealth & Organization)", 
            "Monk (Mindfulness & Wellness)", 
            "Merchant (Finance & Deals)",
            "Ranger (Outdoors & Nature)",
            "Paladin (Helping Others)",
            "Artificer (DIY & Creativity)"
        ];
        const randomTheme = themes[Math.floor(Math.random() * themes.length)];

        const recentQuestsList = recentQuests.length > 0 
            ? `\n\nPREVIOUS QUESTS TO AVOID (do NOT repeat these or similar tasks):\n${recentQuests.map(q => `- ${q.title}: ${q.task}`).join('\n')}`
            : '';

        const prompt = `
      Generate 10 unique "Daily Quests" for a generic human life (NOT focused on tech).
      
      THEME FOR TODAY: ${randomTheme} (Flavor the titles based on this class archetype).
      ${recentQuestsList}
      
      VARIETY REQUIREMENTS:
      - AT LEAST 75% of quests must be COMPLETELY DIFFERENT from the previous quests listed above
      - Be creative! Think of unusual, specific, interesting activities
      - Avoid generic tasks like "drink water", "go for a walk", "clean a room" - make them specific and unique
      
      Mix these categories (approximate):
      - 3 Physical (Movement, Food, Sleep - but specific and varied)
      - 3 "Adulting" (Chores, Finance, Planning - but unique angles)
      - 2 Social/Kindness (Family, Friends, Strangers - specific acts)
      - 2 Creativity/Learning (Reading, Hobbies - varied activities)
      
      EXAMPLES OF GOOD VARIETY:
      - Instead of "Exercise" → "Practice 10 minutes of shadowboxing" or "Dance to 3 songs"
      - Instead of "Clean room" → "Organize one drawer by color" or "Dust the forgotten corners"
      - Instead of "Read" → "Read one short story aloud" or "Learn 5 words in a new language"
      
      Make the titles sound like epic RPG quests. XP between 10-100 based on difficulty.
      
      RETURN JSON ONLY. Format:
      {
        "quests": [
          { 
            "title": "Epic Quest Title", 
            "task": "Specific unique task description", 
            "xp": 30,
            "type": "LIFE" 
          }
        ]
      }
    `;

        const data = await generateAIContent(prompt);

        if (!data || data.type === 'ERROR') return null;

        return data;
    } catch (error) {
        console.error("Quest Generation Failed:", error);
        return { type: "ERROR" };
    }
}

export async function resetAccount(userId: string) {
    if (!userId) return { success: false, message: "No user ID provided" };

    await db.delete(items).where(eq(items.userId, userId));
    await db.delete(skills).where(eq(skills.userId, userId));
    await db.delete(bosses).where(eq(bosses.userId, userId));
    await db.delete(achievements).where(eq(achievements.userId, userId));
    await db.delete(questHistory).where(eq(questHistory.userId, userId));
  
    return { success: true };
}