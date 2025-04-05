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
  actionAppId: text("action_app_id").notNull(),
  actionConfig: json("action_config").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastRunAt: timestamp("last_run_at"),
  runsToday: integer("runs_today").notNull().default(0),
});

export const insertAutomationSchema = createInsertSchema(automations).omit({
  id: true,
  createdAt: true,
  lastRunAt: true,
  runsToday: true,
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
  name: text("name").notNull(),
  config: json("config").notNull(),
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

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
