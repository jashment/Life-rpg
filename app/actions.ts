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
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            Generate 10 "Daily Quests" for a Software Engineer who wants to gamify their life.
            
            Mix the categories:
            - 3 Health (Stretching, Water, Sun)
            - 4 Productivity/Coding (Clean code, Learn something, Git commit)
            - 3 Life/Fun (Read, Music, Kindness)
            
            Give them RPG-style titles.
            Assign XP between 10 (easy) and 50 (hard).
            
            RETURN JSON ONLY. Format:
            {
                "quests": [
                { 
                    "title": "Potion of Clarity", 
                    "task": "Drink water", 
                    "xp": 10,
                    "type": "HEALTH" 
                }
                ]
            }
        `;

        const result = await model.generateContent(prompt);
        console.log(result)
        const text = result.response.text().replace(/```json|```/g, "").trim();
        return JSON.parse(text);

    } catch (error) {
        console.error("Quest Generation Failed:", error);
        return { type: "ERROR" };
    }
}