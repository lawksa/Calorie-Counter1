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
  burnedCaloriesGoal: integer("burned_calories_goal").notNull().default(500),
  height: integer("height"), // height in cm
  targetWeight: integer("target_weight"), // target weight in grams
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
  mealType: text("meal_type").notNull().default("other"), // breakfast, lunch, dinner, snack, other
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
  userId: text("user_id").references(() => users.id), // null = system restaurant, set = user's custom restaurant
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  logo: text("logo"),
  category: text("category").notNull(), // fast_food, saudi, coffee, healthy, etc.
  isFavorite: boolean("is_favorite").default(false),
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

// Weight and body measurements tracking
export const weightLogs = pgTable("weight_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  weight: integer("weight").notNull(), // in grams for precision
  date: timestamp("date").notNull().defaultNow(),
});

// Healthy Recipes
export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  description: text("description"),
  descriptionAr: text("description_ar"),
  ingredients: text("ingredients").array(),
  ingredientsAr: text("ingredients_ar").array(),
  instructions: text("instructions"),
  instructionsAr: text("instructions_ar"),
  calories: integer("calories").notNull(),
  protein: integer("protein").notNull(),
  carbs: integer("carbs").notNull(),
  fats: integer("fats").notNull(),
  prepTime: integer("prep_time"), // in minutes
  category: text("category").notNull(), // breakfast, lunch, dinner, snack, dessert
  imageUrl: text("image_url"),
});

// Exercise/Activity tracking
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  duration: integer("duration").notNull(), // in minutes
  caloriesBurned: integer("calories_burned").notNull(),
  type: text("type").notNull(), // cardio, strength, flexibility, sports
  date: timestamp("date").notNull().defaultNow(),
});

// Daily Challenges
export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleAr: text("title_ar").notNull(),
  description: text("description"),
  descriptionAr: text("description_ar"),
  type: text("type").notNull(), // steps, water, calories, exercise
  targetValue: integer("target_value").notNull(),
  points: integer("points").notNull().default(10),
  icon: text("icon"),
});

// User Challenge Progress
export const userChallenges = pgTable("user_challenges", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id),
  currentValue: integer("current_value").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  date: timestamp("date").notNull().defaultNow(),
});

// Body Measurements (waist, chest, arm, body fat %)
export const bodyMeasurements = pgTable("body_measurements", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  waist: integer("waist"), // in cm
  chest: integer("chest"), // in cm
  arm: integer("arm"), // in cm
  hips: integer("hips"), // in cm
  bodyFat: integer("body_fat"), // percentage * 10 for precision (e.g., 155 = 15.5%)
  date: timestamp("date").notNull().defaultNow(),
});

// Daily Habits Tracking (fruits, vegetables, sleep, etc.)
export const dailyHabits = pgTable("daily_habits", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  fruitsServings: integer("fruits_servings").default(0),
  vegetablesServings: integer("vegetables_servings").default(0),
  sleepHours: integer("sleep_hours"), // in minutes for precision
  steps: integer("steps").default(0),
  date: timestamp("date").notNull().defaultNow(),
});

// Saved Foods (user favorites/bookmarks)
export const savedFoods = pgTable("saved_foods", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  calories: integer("calories").notNull(),
  protein: integer("protein").notNull(),
  carbs: integer("carbs").notNull(),
  fats: integer("fats").notNull(),
  barcode: text("barcode"), // optional - if scanned from barcode
  source: text("source"), // 'barcode', 'camera', 'manual'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Friendships - requests and confirmed friendships
export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  requesterId: text("requester_id").notNull().references(() => users.id),
  addresseeId: text("addressee_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Friend Challenges - challenges between friends
export const friendChallenges = pgTable("friend_challenges", {
  id: serial("id").primaryKey(),
  creatorId: text("creator_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // calories_burned, steps, water, meals_logged
  targetValue: integer("target_value").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull().default("active"), // active, completed, cancelled
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Friend Challenge Participants - tracks who's participating and their progress
export const friendChallengeParticipants = pgTable("friend_challenge_participants", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => friendChallenges.id),
  userId: text("user_id").notNull().references(() => users.id),
  currentValue: integer("current_value").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

// Smart Organizer (AI assistant) items: tasks, reminders, notes, events
export const organizerItems = pgTable("organizer_items", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  type: text("type").notNull().default("task"), // task, reminder, note, event
  title: text("title").notNull(),
  notes: text("notes"),
  category: text("category").notNull().default("general"), // general, work, personal, health, shopping, study
  priority: text("priority").notNull().default("medium"), // low, medium, high
  dueAt: timestamp("due_at"),
  recurrence: text("recurrence"), // null (once), daily, weekly, monthly
  completed: boolean("completed").notNull().default(false),
  notified: boolean("notified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Smart Organizer chat history
export const organizerMessages = pgTable("organizer_messages", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  role: text("role").notNull(), // user, assistant
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Web Push subscriptions (one per browser/device) for reminders while the app is closed
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Small key/value store for server settings (e.g. auto-generated push keys)
export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// === SCHEMAS ===

export const insertGoalSchema = createInsertSchema(goals).omit({ id: true, userId: true, updatedAt: true });
export const insertMealSchema = createInsertSchema(meals).omit({ id: true, userId: true, date: true });
export const insertWaterIntakeSchema = createInsertSchema(waterIntake).omit({ id: true, userId: true, date: true });
export const insertRestaurantSchema = createInsertSchema(restaurants).omit({ id: true });
export const insertMenuItemSchema = createInsertSchema(menuItems).omit({ id: true });
export const insertWeightLogSchema = createInsertSchema(weightLogs).omit({ id: true, userId: true, date: true });
export const insertRecipeSchema = createInsertSchema(recipes).omit({ id: true });
export const insertExerciseSchema = createInsertSchema(exercises).omit({ id: true, userId: true, date: true });
export const insertChallengeSchema = createInsertSchema(challenges).omit({ id: true });
export const insertUserChallengeSchema = createInsertSchema(userChallenges).omit({ id: true, userId: true, date: true });
export const insertBodyMeasurementSchema = createInsertSchema(bodyMeasurements).omit({ id: true, userId: true, date: true });
export const insertDailyHabitSchema = createInsertSchema(dailyHabits).omit({ id: true, userId: true, date: true });
export const insertSavedFoodSchema = createInsertSchema(savedFoods).omit({ id: true, userId: true, createdAt: true });
export const insertFriendshipSchema = createInsertSchema(friendships).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFriendChallengeSchema = createInsertSchema(friendChallenges).omit({ id: true, createdAt: true });
export const insertFriendChallengeParticipantSchema = createInsertSchema(friendChallengeParticipants).omit({ id: true, joinedAt: true });
export const insertOrganizerItemSchema = createInsertSchema(organizerItems).omit({ id: true, userId: true, createdAt: true, notified: true });

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

export type WeightLog = typeof weightLogs.$inferSelect;
export type InsertWeightLog = z.infer<typeof insertWeightLogSchema>;

export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;

export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;

export type UserChallenge = typeof userChallenges.$inferSelect;
export type InsertUserChallenge = z.infer<typeof insertUserChallengeSchema>;

export type BodyMeasurement = typeof bodyMeasurements.$inferSelect;
export type InsertBodyMeasurement = z.infer<typeof insertBodyMeasurementSchema>;

export type DailyHabit = typeof dailyHabits.$inferSelect;
export type InsertDailyHabit = z.infer<typeof insertDailyHabitSchema>;

export type SavedFood = typeof savedFoods.$inferSelect;
export type InsertSavedFood = z.infer<typeof insertSavedFoodSchema>;

export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;

export type FriendChallenge = typeof friendChallenges.$inferSelect;
export type InsertFriendChallenge = z.infer<typeof insertFriendChallengeSchema>;

export type FriendChallengeParticipant = typeof friendChallengeParticipants.$inferSelect;
export type InsertFriendChallengeParticipant = z.infer<typeof insertFriendChallengeParticipantSchema>;

export type OrganizerItem = typeof organizerItems.$inferSelect;
export type InsertOrganizerItem = z.infer<typeof insertOrganizerItemSchema>;

export type OrganizerMessage = typeof organizerMessages.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

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
