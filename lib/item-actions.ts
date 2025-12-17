'use server'

import { db } from "@/lib/db";
import { items } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { v4 as uuidv4 } from 'uuid';

export async function getInventory() {
  const result = await db.select().from(items).orderBy(desc(items.dateFound));
  return result.map(i => ({
    id: i.uniqueId,
    name: i.name,
    description: i.description,
    emoji: i.emoji,
    rarity: i.rarity,
    type: i.type,
  }));
}

export async function checkForLoot(questTitle: string) {
  // 1. Roll the Dice (30% chance)
  const roll = Math.random();
  if (roll > 0.3) return null; // Bad luck, no loot

  // 2. Determine Rarity
  let rarity = "COMMON";
  if (Math.random() > 0.7) rarity = "RARE";
  if (Math.random() > 0.9) rarity = "EPIC";
  if (Math.random() > 0.98) rarity = "LEGENDARY";

  // 3. Ask AI to forge the item
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Matching your other actions

  const prompt = `
    The player just completed a real-life RPG quest: "${questTitle}".
    Generate a fantasy Loot Item that relates to this task.
    
    Rarity: ${rarity} (Make the name and description match the rarity).
    
    Examples:
    - Quest: "Drink Water" -> Item: "Potion of Hydration" (Common)
    - Quest: "Fix Server Bug" -> Item: "Hammer of the Banhammer" (Rare)
    
    RETURN JSON ONLY:
    { "name": "Item Name", "description": "Funny flavor text", "emoji": "⚔️", "type": "WEAPON"|"ARMOR"|"POTION"|"RELIC" }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    const data = JSON.parse(text);

    // 4. Save to Drizzle DB
    const newId = uuidv4();
    await db.insert(items).values({
      uniqueId: newId,
      name: data.name,
      description: data.description,
      emoji: data.emoji,
      rarity: rarity,
      type: data.type
    });

    // Return the item object to display in UI
    return {
      id: newId,
      name: data.name,
      description: data.description,
      emoji: data.emoji,
      rarity: rarity,
      type: data.type
    };

  } catch (e) {
    console.error("Loot gen failed", e);
    return null;
  }
}
