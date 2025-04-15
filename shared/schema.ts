import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table schema (optional for future auth)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Automation table schema
export const automations = pgTable("automations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
  triggerAppId: text("trigger_app_id").notNull(),
  triggerConfig: json("trigger_config").notNull(),
  actionAppId: text("action_app_id").notNull(), // Kept for backwards compatibility
  actionConfig: json("action_config").notNull(), // Kept for backwards compatibility
  actions: json("actions").default([]),  // New field for multiple actions
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastRunAt: timestamp("last_run_at"),
  runsToday: integer("runs_today").notNull().default(0),
  healthScore: integer("health_score").notNull().default(100),
  complexity: integer("complexity").notNull().default(1),
  reliability: json("reliability").default({
    successRate: 100,
    errorCount: 0,
    totalRuns: 0
  }),
});

export const insertAutomationSchema = createInsertSchema(automations).omit({
  id: true,
  createdAt: true,
  lastRunAt: true,
  runsToday: true,
  healthScore: true,
  complexity: true,
  reliability: true,
});

// Execution history table schema
export const executionHistories = pgTable("execution_histories", {
  id: serial("id").primaryKey(),
  automationId: integer("automation_id").notNull(),
  status: text("status").notNull(), // 'success', 'error'
  message: text("message"),
  executedAt: timestamp("executed_at").notNull().defaultNow(),
  data: json("data"),
});

export const insertExecutionHistorySchema = createInsertSchema(executionHistories).omit({
  id: true,
  executedAt: true,
});

// App connection table schema for storing OAuth tokens etc.
export const appConnections = pgTable("app_connections", {
  id: serial("id").primaryKey(),
  appId: text("app_id").notNull(),
  username: text("username"),
  permissions: json("permissions").default(['read']),
  credentials: json("credentials"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAppConnectionSchema = createInsertSchema(appConnections).omit({
  id: true,
  createdAt: true,
});

// Template table schema
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  triggerAppId: text("trigger_app_id").notNull(),
  actionAppId: text("action_app_id").notNull(),
  templateConfig: json("template_config").notNull(),
  popular: boolean("popular").notNull().default(false),
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Automation = typeof automations.$inferSelect;
export type InsertAutomation = z.infer<typeof insertAutomationSchema>;

export type ExecutionHistory = typeof executionHistories.$inferSelect;
export type InsertExecutionHistory = z.infer<typeof insertExecutionHistorySchema>;

export type AppConnection = typeof appConnections.$inferSelect;
export type InsertAppConnection = z.infer<typeof insertAppConnectionSchema>;

// Achievements table schema
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'reliability', 'complexity', 'volume', 'innovation'
  icon: text("icon").notNull(),
  threshold: integer("threshold").notNull(),
  unlockedAt: timestamp("unlocked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  unlockedAt: true,
  createdAt: true,
});

// User achievements table schema
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  achievementId: integer("achievement_id").notNull(),
  automationId: integer("automation_id").notNull(),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  unlockedAt: true,
});

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
