'use server'

import { db } from "@/lib/db";
import { bosses, items } from "@/lib/schema";
import { eq, and, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';
import { generateAIContent } from "../app/ai-service";

async function generateBoss(userId: string, level: number) {

    const defense = level * 30;
  

    const prompt = `
    Generate a scary RPG Boss Monster that represents a "Life Obstacle" for a Level ${level} player.
    Examples: "The Lord of Laziness", "The Specter of Burnout", "The Golem of Debt".
    
    Stats:
    HP should be approx ${level * 100}, Defense should be approx ${defense}
    
    RETURN JSON:
    { "name": "Name", "description": "Scary description", "hp": 500 }
  `;

    const data = await generateAIContent(prompt);

    if (!data || data.type === 'ERROR') return null;

    const [newBoss] = await db.insert(bosses).values({
        userId: userId,
        uniqueId: uuidv4(),
        name: data.name,
        description: data.description,
        level: level,
        hp: data.hp,
        maxHp: data.hp,
        status: 'ALIVE',
        defense: defense,
    }).returning();

    return newBoss;
}

export async function checkBossSpawn(userId: string, userLevel: number) {
    // Bosses appear at level 5, 10, 15, etc.
    if (userLevel % 5 !== 0) return null;

    // Check if we already beat this level's boss
    const existing = await db.select().from(bosses).where(
        and(eq(bosses.userId, userId), eq(bosses.level, userLevel), eq(bosses.status, 'ALIVE'))
    );

    if (existing.length > 0) return existing[0];

    // If no alive boss exists for this level, check if we already killed one
    const dead = await db.select().from(bosses).where(
        and(eq(bosses.userId, userId), eq(bosses.level, userLevel), eq(bosses.status, 'DEFEATED'))
    );
  
    if (dead.length > 0) return null; // Already beat the boss for this tier

    // SPAWN NEW BOSS
    return await generateBoss(userId, userLevel);
}



// 2. FIGHT LOGIC
export async function fightBoss(userId: string, bossId: string, itemIds: string[]) {
    // Get the boss
    const [boss] = await db.select().from(bosses).where(
        and(
            eq(bosses.uniqueId, bossId),
            eq(bosses.userId, userId)
        )
    );
    if (!boss || boss.status !== 'ALIVE') return { result: 'ERROR' };

    // Get the items used
    // In a real app we would query whereIn(items.uniqueId, itemIds)
    // For simplicity, we assume we passed the item details or fetch all
    let equipped: any[] = [];
    if (itemIds.length > 0) {
        equipped = await db.select().from(items).where(
            and(
                eq(items.userId, userId),
                inArray(items.uniqueId, itemIds)
            )
        );
    }
    const playerPower = equipped.reduce((sum, item) => sum + (item.power || 0), 0);

    const powerRatio = playerPower / (boss.defense || 1);
    const winChance = Math.min(0.95, Math.max(0.1, powerRatio - 0.2));

    const roll = Math.random();
    const isWin = roll < winChance;

    const prompt = `
    BATTLE SIMULATION:
    Player Power: ${playerPower}
    Boss: ${boss.name} (HP: ${boss.hp})
    Result: ${isWin ? "WIN" : "LOSS"}.
    Items Used: ${equipped.map(i => i.name).join(", ")}.
    
    Player uses these items:
    ${equipped.map(i => `- ${i.name} (${i.rarity} ${i.type})`).join('\n')}
    
    Rules:
    - Legendary/Epic items deal massive damage.
    - Common items deal low damage.
    - If the items make sense against the boss (e.g. "Water" vs "Fire Boss"), bonus damage.
    
    DECIDE:
    1. Did the player win? (Win chance increases with better loot).
    2. Write a short, exciting 2-sentence battle log. 
      If LOSS: Explain how the user's gear was too weak.
      If WIN: Explain how the items overpowered the boss.
    3. Calculate damage dealt.
    
    RETURN JSON:
    { "win": boolean, "log": "You struck the dragon...", "damageDealt": number }
  `;

    const battle = await generateAIContent(prompt);

    if (!battle || battle.type === 'ERROR') return null;
    
    const battleLog = battle?.log || (isWin ? "You defeated the boss!" : "You took a hit but survived.");
  
    const damageDealt = isWin ? boss.hp : Math.floor(boss.hp * 0.1);

    // Update DB
    let newStatus = 'ALIVE';
    let remainingHp = boss.hp - battle.damageDealt;
  
    if (battle.win || remainingHp <= 0) {
        newStatus = 'DEFEATED';
        remainingHp = 0;
    }

    await db.update(bosses).set({ hp: remainingHp, status: newStatus }).where(
        and(
            eq(bosses.uniqueId, bossId),
            eq(bosses.userId, userId)
        )
    );

    return { 
        win: isWin,
        log: battleLog,
        damageDealt,
        remainingHp, 
        bossName: boss.name,
        newStatus 
    };
}
