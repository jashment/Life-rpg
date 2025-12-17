import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  uniqueId: text("unique_id").notNull().unique(),
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
  title: text("title").notNull(),
  task: text("task").notNull(),
  questType: text("quest_type").notNull(),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  uniqueId: text("unique_id").notNull().unique(), 
  name: text("name").notNull(),
  description: text("description").notNull(),
  emoji: text("emoji").notNull(),
  rarity: text("rarity").notNull(), 
  type: text("type").notNull(),     
  dateFound: timestamp("date_found").notNull().defaultNow(),
});

export type Item = typeof items.$inferSelect;
export type InsertItem = typeof items.$inferInsert;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;
export type QuestHistory = typeof questHistory.$inferSelect;
export type InsertQuestHistory = typeof questHistory.$inferInsert;
