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

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;
