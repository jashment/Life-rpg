'use server'

import { db } from "@/lib/db";
import { bosses, items } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';
import { generateAIContent } from "../app/ai-service";

async function generateBoss(level: number) {

    const prompt = `
    Generate a scary RPG Boss Monster that represents a "Life Obstacle" for a Level ${level} player.
    Examples: "The Lord of Laziness", "The Specter of Burnout", "The Golem of Debt".
    
    Stats:
    HP should be approx ${level * 100}.
    
    RETURN JSON:
    { "name": "Name", "description": "Scary description", "hp": 500 }
  `;

    const data = await generateAIContent(prompt);

    if (!data || data.type === 'ERROR') return null;

    const [newBoss] = await db.insert(bosses).values({
        uniqueId: uuidv4(),
        name: data.name,
        description: data.description,
        level: level,
        hp: data.hp,
        maxHp: data.hp,
        status: 'ALIVE'
    }).returning();

    return newBoss;
}

export async function checkBossSpawn(userLevel: number) {
    // Bosses appear at level 5, 10, 15, etc.
    if (userLevel % 5 !== 0) return null;

    // Check if we already beat this level's boss
    const existing = await db.select().from(bosses).where(
        and(eq(bosses.level, userLevel), eq(bosses.status, 'ALIVE'))
    );

    if (existing.length > 0) return existing[0];

    // If no alive boss exists for this level, check if we already killed one
    const dead = await db.select().from(bosses).where(
        and(eq(bosses.level, userLevel), eq(bosses.status, 'DEFEATED'))
    );
  
    if (dead.length > 0) return null; // Already beat the boss for this tier

    // SPAWN NEW BOSS
    return await generateBoss(userLevel);
}



// 2. FIGHT LOGIC
export async function fightBoss(bossId: string, itemIds: string[]) {
    // Get the boss
    const [boss] = await db.select().from(bosses).where(eq(bosses.uniqueId, bossId));
    if (!boss || boss.status !== 'ALIVE') return { result: 'ERROR' };

    // Get the items used
    // In a real app we would query whereIn(items.uniqueId, itemIds)
    // For simplicity, we assume we passed the item details or fetch all
    const allItems = await db.select().from(items);
    const equipped = allItems.filter(i => itemIds.includes(i.uniqueId));

    const prompt = `
    BATTLE SIMULATION:
    Player Level: ${boss.level}
    Boss: ${boss.name} (HP: ${boss.hp})
    
    Player uses these items:
    ${equipped.map(i => `- ${i.name} (${i.rarity} ${i.type})`).join('\n')}
    
    Rules:
    - Legendary/Epic items deal massive damage.
    - Common items deal low damage.
    - If the items make sense against the boss (e.g. "Water" vs "Fire Boss"), bonus damage.
    
    DECIDE:
    1. Did the player win? (Win chance increases with better loot).
    2. Write a short, exciting 2-sentence battle log.
    3. Calculate damage dealt.
    
    RETURN JSON:
    { "win": boolean, "log": "You struck the dragon...", "damageDealt": number }
  `;

    const battle = await generateAIContent(prompt);

    if (!battle || battle.type === 'ERROR') return null;

    // Update DB
    let newStatus = 'ALIVE';
    let remainingHp = boss.hp - battle.damageDealt;
  
    if (battle.win || remainingHp <= 0) {
        newStatus = 'DEFEATED';
        remainingHp = 0;
    }

    await db.update(bosses).set({ hp: remainingHp, status: newStatus }).where(eq(bosses.uniqueId, bossId));

    return { 
        ...battle, 
        remainingHp, 
        bossName: boss.name,
        newStatus 
    };
}
