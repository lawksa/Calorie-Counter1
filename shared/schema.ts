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
  waterGlasses: integer("water_glasses").notNull().default(8),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Meals logged by user
export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  calories: integer("calories").notNull(),
  protein: integer("protein").notNull(),
  carbs: integer("carbs").notNull(),
  fats: integer("fats").notNull(),
  date: timestamp("date").notNull().defaultNow(),
});

// Water intake tracking
export const waterIntake = pgTable("water_intake", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  glasses: integer("glasses").notNull().default(0),
  date: timestamp("date").notNull().defaultNow(),
});

// Saudi Restaurants
export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  logo: text("logo"),
  category: text("category").notNull(), // fast_food, saudi, coffee, healthy, etc.
});

// Restaurant Menu Items
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurants.id),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  calories: integer("calories").notNull(),
  protein: integer("protein").notNull(),
  carbs: integer("carbs").notNull(),
  fats: integer("fats").notNull(),
  category: text("category"), // main, sides, drinks, desserts
});

// === SCHEMAS ===

export const insertGoalSchema = createInsertSchema(goals).omit({ id: true, userId: true, updatedAt: true });
export const insertMealSchema = createInsertSchema(meals).omit({ id: true, userId: true, date: true });
export const insertWaterIntakeSchema = createInsertSchema(waterIntake).omit({ id: true, userId: true, date: true });
export const insertRestaurantSchema = createInsertSchema(restaurants).omit({ id: true });
export const insertMenuItemSchema = createInsertSchema(menuItems).omit({ id: true });

// === TYPES ===

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;

export type WaterIntake = typeof waterIntake.$inferSelect;
export type InsertWaterIntake = z.infer<typeof insertWaterIntakeSchema>;

export type Restaurant = typeof restaurants.$inferSelect;
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

// Request Types
export type CreateMealRequest = InsertMeal & { date?: string };
export type UpdateGoalRequest = InsertGoal;

// AI Estimate Request
export type EstimateCaloriesRequest = {
  query: string;
};

export type NutritionEstimate = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};
