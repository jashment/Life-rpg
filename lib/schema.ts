import { pgTable, serial, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid("id").primaryKey(),
    email: text("email"),
    username: text("username"),
    level: integer("level").default(1),
    createdAt: timestamp("created_at").defaultNow(),
});

export const achievements = pgTable("achievements", {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    uniqueId: text("unique_id").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    emoji: text("emoji").notNull(),
    count: integer("count").notNull().default(1),
    xp: integer("xp").notNull(),
    lastEarned: timestamp("last_earned").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const questHistory = pgTable("quest_history", {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    title: text("title").notNull(),
    task: text("task").notNull(),
    questType: text("quest_type").notNull(),
    generatedAt: timestamp("generated_at").notNull().defaultNow(),
});

export const items = pgTable("items", {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    uniqueId: text("unique_id").notNull(), 
    name: text("name").notNull(),
    description: text("description").notNull(),
    emoji: text("emoji").notNull(),
    rarity: text("rarity").notNull(),
    power: integer("power").notNull().default(0),
    type: text("type").notNull(),     
    dateFound: timestamp("date_found").notNull().defaultNow(),
});

export const bosses = pgTable("bosses", {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    uniqueId: text("unique_id").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    level: integer("level").notNull(),
    hp: integer("hp").notNull(),
    maxHp: integer("max_hp").notNull(),
    defense: integer("defense").notNull().default(100),
    status: text("status").notNull(),   // ALIVE, DEFEATED
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const skills = pgTable("skills", {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    name: text("name").notNull(),
    effect: text("effect").notNull(),
    level: integer("level").notNull().default(1),
    unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
});

export type Boss = typeof bosses.$inferSelect;
export type InsertBoss = typeof bosses.$inferInsert;
export type Skill = typeof skills.$inferSelect;
export type Item = typeof items.$inferSelect;
export type InsertItem = typeof items.$inferInsert;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;
export type QuestHistory = typeof questHistory.$inferSelect;
export type InsertQuestHistory = typeof questHistory.$inferInsert;