import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Export Auth Models
export * from "./models/auth";
import { users } from "./models/auth";

// === TABLE DEFINITIONS ===

// Goals for a user (one row per user)
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  calories: integer("calories").notNull().default(2000),
  protein: integer("protein").notNull().default(150),
  carbs: integer("carbs").notNull().default(200),
  fats: integer("fats").notNull().default(65),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Meals logged by user
export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(), // e.g., "Chicken Salad"
  calories: integer("calories").notNull(),
  protein: integer("protein").notNull(),
  carbs: integer("carbs").notNull(),
  fats: integer("fats").notNull(),
  date: timestamp("date").notNull().defaultNow(), // Logged time
});

// === SCHEMAS ===

export const insertGoalSchema = createInsertSchema(goals).omit({ id: true, userId: true, updatedAt: true });
export const insertMealSchema = createInsertSchema(meals).omit({ id: true, userId: true, date: true });

// === TYPES ===

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;

// Request Types
export type CreateMealRequest = InsertMeal & { date?: string }; // Optional date override
export type UpdateGoalRequest = InsertGoal;

// AI Estimate Request
export type EstimateCaloriesRequest = {
  query: string; // e.g., "2 eggs and a slice of toast"
};

export type NutritionEstimate = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};
