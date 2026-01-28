'use server'

import { db } from "@/lib/db";
import { items } from "@/lib/schema";
import { desc, eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';
import { generateAIContent } from "../app/ai-service";

import { Item } from "../app/types";
export async function getInventory(userId: string): Promise<Item[]> {
    const result = await db.select().from(items).where(eq(items.userId, userId)).orderBy(desc(items.dateFound));
    return result.map(i => ({
        id: i.uniqueId,
        name: i.name,
        description: i.description,
        emoji: i.emoji,
        rarity: i.rarity,
        type: i.type,
        power: i.power,
        equipped: i.equipped,
        placement: i.placement ?? undefined,
        slot: i.slot ?? undefined
    }));
}

function getLootPrompt(questTitle: string, rarity: string, minPower: number, maxPower: number, level: number) {
    const placements = ["HEAD", "HAND", "CHEST", "LEGS", "FEET", "RING"];
    return `
    The player (level ${level}) just completed a real-life RPG quest: "${questTitle}".
    Generate a fantasy Loot Item that relates to this task.
    
    Rarity: ${rarity} (Make the name and description match the rarity).
    Power Level: Choose a number between ${minPower} and ${maxPower} that also matches the rarity and player level.
    Placement: Choose one of the following placements: ${placements.join(", ")}.
    
    Examples:
    - Quest: "Drink Water" -> Item: "Potion of Hydration" (Common)
    - Quest: "Fix Server Bug" -> Item: "Hammer of the Banhammer" (Rare)
    
    RETURN JSON ONLY:
    { "name": "Item Name", "description": "Funny flavor text", "emoji": "⚔️", "type": "WEAPON"|"ARMOR"|"POTION"|"RELIC", "power": number, "placement": "HEAD"|"HAND"|"CHEST"|"LEGS"|"FEET"|"RING" }
  `;
}

export async function checkForLoot(
    userId: string,
    questTitle: string,
    level: number
): Promise<Item | null> {
    // 1. Roll the Dice (30% chance)
    const roll = Math.random();
    if (roll > 0.3) return null; // Bad luck, no loot

    // 2. Determine Rarity
    let rarity = "COMMON";
    if (Math.random() > 0.7) rarity = "RARE";
    if (Math.random() > 0.9) rarity = "EPIC";
    if (Math.random() > 0.98) rarity = "LEGENDARY";
  
    // Define Power Ranges based on the Rarity and level we just rolled
    const levelBonus = Math.floor(level / 5);
    let minPower = 1 + levelBonus, maxPower = 10 + levelBonus;
    if (rarity === "RARE") { minPower = 20 + levelBonus; maxPower = 40 + levelBonus; }
    if (rarity === "EPIC") { minPower = 50 + levelBonus; maxPower = 75 + levelBonus; }
    if (rarity === "LEGENDARY") { minPower = 80 + levelBonus; maxPower = 120 + levelBonus; }

    // 3. Ask AI to forge the item
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return null;

    const prompt = getLootPrompt(questTitle, rarity, minPower, maxPower, level);

    try {
        const data = await generateAIContent(prompt); // <--- Handles Gemini OR Ollama automatically

        if (!data || !data.name || !data.description || !data.emoji || !data.power) return null;

        const placements = ["HEAD", "HAND", "CHEST", "LEGS", "FEET", "RING"];
        let placement = data.placement;
        if (!placement || !placements.includes(placement)) {
            placement = placements[Math.floor(Math.random() * placements.length)];
        }

        // 4. Save to Drizzle DB
        const newId = uuidv4();
        const newItemData = {
            userId: userId,
            uniqueId: newId,
            name: data.name,
            description: data.description,
            emoji: data.emoji,
            rarity: rarity,
            type: data.type,
            power: data.power,
            placement: placement
        };
        await db.insert(items).values(newItemData);

        // Return the item object to display in UI
        return {
            id: newId,
            name: data.name,
            description: data.description,
            emoji: data.emoji,
            rarity: rarity,
            type: data.type,
            power: data.power,
            equipped: false,
            placement: placement,
            slot: 0
        };

    } catch (e) {
        console.error("Loot gen failed", e);
        return null;
    }
}

export async function equipItem(userId: string, itemId: string, placement: string, slot: number) {
    // Unequip any item in the same slot
    await db.update(items).set({ equipped: false, slot: 0 }).where(
        and(
            eq(items.userId, userId),
            eq(items.placement, placement),
            eq(items.slot, slot)
        )
    );
    
    // Equip the new item
    await db.update(items).set({ equipped: true, slot: slot }).where(
        and(
            eq(items.userId, userId),
            eq(items.uniqueId, itemId)
        )
    );
}

export async function unequipItem(userId: string, itemId: string) {
    await db.update(items).set({ equipped: false, slot: 0 }).where(and(eq(items.userId, userId), eq(items.uniqueId, itemId)));
}

export async function getEquippedItems(userId: string): Promise<Item[]> {
    const result = await db.select().from(items).where(and(eq(items.userId, userId), eq(items.equipped, true)));
    return result.map(i => ({
        id: i.uniqueId,
        name: i.name,
        description: i.description,
        emoji: i.emoji,
        rarity: i.rarity,
        type: i.type,
        power: i.power,
        equipped: i.equipped,
        placement: i.placement ?? undefined,
        slot: i.slot ?? undefined
    }));
}
