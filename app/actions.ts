'use server'

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Achievement } from "./types";

export async function processLog(userLog: string, currentAchievements: Achievement[]) {
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        console.error("❌ ERROR: No API Key found in .env.local");
        return { type: "ERROR", message: "API Key Missing" };
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

export async function generateDailyQuests() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return { type: "ERROR", message: "No API Key" };

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // temperature: 1.1 makes it very creative/random
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      generationConfig: { temperature: 1.1 } 
    });

    // 1. Pick a random "Vibe" for the day so it's not always the same
    const themes = ["Barbarian (Physical)", "Bard (Social)", "Wizard (Intellectual)", "Rogue (Stealth/Chores)", "Monk (Mindfulness)", "Merchant (Finance)"];
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];

    const prompt = `
      Generate 10 "Daily Quests" for a generic human life (NOT focused on tech).
      
      THEME FOR TODAY: ${randomTheme} (Flavor the titles based on this).
      
      Mix these categories (approximate):
      - 3 Physical (Movement, Food, Sleep)
      - 3 "Adulting" (Chores, Finance, Planning)
      - 2 Social/Kindness (Family, Friends, Strangers)
      - 2 Creativity/Learning (Reading, Hobbies)
      
      CRITICAL INSTRUCTIONS:
      - Do NOT repeat the same generic tasks (like "Drink water") every time. Vary them.
      - Make the titles sound like an RPG quest.
      - XP between 10-100 based on difficulty.
      
      RETURN JSON ONLY. Format:
      {
        "quests": [
          { 
            "title": "Clean the Stables", 
            "task": "Do the dishes or clean one room", 
            "xp": 30,
            "type": "LIFE" 
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);

  } catch (error) {
    console.error("Quest Generation Failed:", error);
    return { type: "ERROR" };
  }
}
