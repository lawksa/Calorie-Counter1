import { 
  users, goals, meals, waterIntake, restaurants, menuItems, 
  weightLogs, recipes, exercises, challenges, userChallenges,
  bodyMeasurements, dailyHabits, savedFoods,
  organizerItems, organizerMessages, pushSubscriptions, type PushSubscription, type OrganizerItem, type InsertOrganizerItem, type OrganizerMessage,
  type User, type UpsertUser, type Goal, type InsertGoal, 
  type Meal, type InsertMeal, type WaterIntake, type Restaurant, type MenuItem,
  type WeightLog, type InsertWeightLog, type Recipe, type Exercise, type InsertExercise,
  type Challenge, type UserChallenge,
  type BodyMeasurement, type InsertBodyMeasurement, type DailyHabit, type InsertDailyHabit,
  type SavedFood, type InsertSavedFood,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lt, lte, desc, sql, or, ne, isNull } from "drizzle-orm";

export interface IStorage {
  // Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;

  // Goals
  getGoal(userId: string): Promise<Goal | undefined>;
  createOrUpdateGoal(userId: string, goal: InsertGoal): Promise<Goal>;

  // Meals
  getMeals(userId: string, date: Date): Promise<Meal[]>;
  getMealsDateRange(userId: string, startDate: Date, endDate: Date): Promise<Meal[]>;
  createMeal(userId: string, meal: InsertMeal & { date?: Date }): Promise<Meal>;
  deleteMeal(id: number, userId: string): Promise<void>;

  // Water
  getWaterIntake(userId: string, date: Date): Promise<WaterIntake | undefined>;
  getWaterIntakeDateRange(userId: string, startDate: Date, endDate: Date): Promise<WaterIntake[]>;
  updateWaterIntake(userId: string, glasses: number, date: Date): Promise<WaterIntake>;

  // Restaurants
  getRestaurants(userId: string): Promise<Restaurant[]>;
  createRestaurant(userId: string, data: { name: string; nameAr: string; category: string; logo: string | null }): Promise<Restaurant>;
  toggleRestaurantFavorite(restaurantId: number, userId: string): Promise<Restaurant | null>;
  getMenuItems(restaurantId: number): Promise<MenuItem[]>;
  createMenuItem(data: { restaurantId: number; name: string; nameAr: string; calories: number; protein: number; carbs: number; fats: number; category: string }): Promise<MenuItem>;

  // Weight
  getWeightLogs(userId: string, limit?: number): Promise<WeightLog[]>;
  createWeightLog(userId: string, weight: number): Promise<WeightLog>;
  deleteWeightLog(id: number, userId: string): Promise<void>;

  // Recipes
  getRecipes(category?: string): Promise<Recipe[]>;
  getRecipe(id: number): Promise<Recipe | undefined>;

  // Exercises
  getExercises(userId: string, date: Date): Promise<Exercise[]>;
  getExercisesDateRange(userId: string, startDate: Date, endDate: Date): Promise<Exercise[]>;
  createExercise(userId: string, exercise: InsertExercise): Promise<Exercise>;
  deleteExercise(id: number, userId: string): Promise<void>;

  // Challenges
  getChallenges(): Promise<Challenge[]>;
  getUserChallenges(userId: string, date: Date): Promise<(UserChallenge & { challenge: Challenge })[]>;
  updateUserChallenge(userId: string, challengeId: number, currentValue: number, completed: boolean): Promise<UserChallenge>;

  // Body Measurements
  getBodyMeasurements(userId: string, limit?: number): Promise<BodyMeasurement[]>;
  createBodyMeasurement(userId: string, measurement: InsertBodyMeasurement): Promise<BodyMeasurement>;
  deleteBodyMeasurement(id: number, userId: string): Promise<void>;

  // Daily Habits
  getDailyHabit(userId: string, date: Date): Promise<DailyHabit | undefined>;
  updateDailyHabit(userId: string, habit: InsertDailyHabit, date: Date): Promise<DailyHabit>;

  // Saved Foods
  getSavedFoods(userId: string): Promise<SavedFood[]>;
  createSavedFood(userId: string, food: InsertSavedFood): Promise<SavedFood>;
  deleteSavedFood(id: number, userId: string): Promise<void>;

  // Smart Organizer
  getOrganizerItems(userId: string): Promise<OrganizerItem[]>;
  getOrganizerItem(id: number, userId: string): Promise<OrganizerItem | undefined>;
  getDueOrganizerItems(now: Date): Promise<OrganizerItem[]>;
  createOrganizerItem(userId: string, item: InsertOrganizerItem): Promise<OrganizerItem>;
  updateOrganizerItem(id: number, userId: string, updates: Partial<InsertOrganizerItem> & { notified?: boolean }): Promise<OrganizerItem | undefined>;
  deleteOrganizerItem(id: number, userId: string): Promise<void>;
  getOrganizerMessages(userId: string, limit?: number): Promise<OrganizerMessage[]>;
  createOrganizerMessage(userId: string, role: string, content: string): Promise<OrganizerMessage>;
  clearOrganizerMessages(userId: string): Promise<void>;

  // Push subscriptions
  getPushSubscriptions(userId: string): Promise<PushSubscription[]>;
  savePushSubscription(userId: string, sub: { endpoint: string; p256dh: string; auth: string }): Promise<PushSubscription>;
  deletePushSubscription(endpoint: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Auth methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Goals
  async getGoal(userId: string): Promise<Goal | undefined> {
    const [goal] = await db.select().from(goals).where(eq(goals.userId, userId));
    return goal;
  }

  async createOrUpdateGoal(userId: string, goalData: InsertGoal): Promise<Goal> {
    const existing = await this.getGoal(userId);
    if (existing) {
      const [updated] = await db
        .update(goals)
        .set({ ...goalData, updatedAt: new Date() })
        .where(eq(goals.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(goals)
        .values({ ...goalData, userId })
        .returning();
      return created;
    }
  }

  // Meals
  async getMeals(userId: string, date: Date): Promise<Meal[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return db
      .select()
      .from(meals)
      .where(
        and(
          eq(meals.userId, userId),
          gte(meals.date, startOfDay),
          lt(meals.date, endOfDay)
        )
      )
      .orderBy(desc(meals.date));
  }

  async createMeal(userId: string, mealData: InsertMeal & { date?: Date }): Promise<Meal> {
    const [meal] = await db
      .insert(meals)
      .values({
        ...mealData,
        userId,
        date: mealData.date || new Date(),
      })
      .returning();
    return meal;
  }

  async deleteMeal(id: number, userId: string): Promise<void> {
    await db
      .delete(meals)
      .where(and(eq(meals.id, id), eq(meals.userId, userId)));
  }

  // Water
  async getWaterIntake(userId: string, date: Date): Promise<WaterIntake | undefined> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [water] = await db
      .select()
      .from(waterIntake)
      .where(
        and(
          eq(waterIntake.userId, userId),
          gte(waterIntake.date, startOfDay),
          lt(waterIntake.date, endOfDay)
        )
      );
    return water;
  }

  async updateWaterIntake(userId: string, glasses: number, date: Date): Promise<WaterIntake> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await this.getWaterIntake(userId, date);
    
    if (existing) {
      const [updated] = await db
        .update(waterIntake)
        .set({ glasses })
        .where(eq(waterIntake.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(waterIntake)
        .values({ userId, glasses, date: startOfDay })
        .returning();
      return created;
    }
  }

  // Restaurants
  async getRestaurants(userId: string): Promise<Restaurant[]> {
    // Get system restaurants and user's custom restaurants
    return db.select().from(restaurants)
      .where(or(
        isNull(restaurants.userId),
        eq(restaurants.userId, userId)
      ))
      .orderBy(desc(restaurants.isFavorite), restaurants.name);
  }

  async createRestaurant(userId: string, data: { name: string; nameAr: string; category: string; logo: string | null }): Promise<Restaurant> {
    const [restaurant] = await db.insert(restaurants).values({
      userId,
      name: data.name,
      nameAr: data.nameAr,
      category: data.category,
      logo: data.logo,
      isFavorite: false,
    }).returning();
    return restaurant;
  }

  async toggleRestaurantFavorite(restaurantId: number, userId: string): Promise<Restaurant | null> {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, restaurantId));
    if (!restaurant) return null;
    
    const [updated] = await db.update(restaurants)
      .set({ isFavorite: !restaurant.isFavorite })
      .where(eq(restaurants.id, restaurantId))
      .returning();
    return updated;
  }

  async getMenuItems(restaurantId: number): Promise<MenuItem[]> {
    return db
      .select()
      .from(menuItems)
      .where(eq(menuItems.restaurantId, restaurantId))
      .orderBy(menuItems.category, menuItems.name);
  }

  async createMenuItem(data: { restaurantId: number; name: string; nameAr: string; calories: number; protein: number; carbs: number; fats: number; category: string }): Promise<MenuItem> {
    const [menuItem] = await db.insert(menuItems).values(data).returning();
    return menuItem;
  }

  // Date range for meals (for statistics)
  async getMealsDateRange(userId: string, startDate: Date, endDate: Date): Promise<Meal[]> {
    return db
      .select()
      .from(meals)
      .where(
        and(
          eq(meals.userId, userId),
          gte(meals.date, startDate),
          lt(meals.date, endDate)
        )
      )
      .orderBy(desc(meals.date));
  }

  // Water intake date range
  async getWaterIntakeDateRange(userId: string, startDate: Date, endDate: Date): Promise<WaterIntake[]> {
    return db
      .select()
      .from(waterIntake)
      .where(
        and(
          eq(waterIntake.userId, userId),
          gte(waterIntake.date, startDate),
          lt(waterIntake.date, endDate)
        )
      )
      .orderBy(desc(waterIntake.date));
  }

  // Weight Logs
  async getWeightLogs(userId: string, limit: number = 30): Promise<WeightLog[]> {
    return db
      .select()
      .from(weightLogs)
      .where(eq(weightLogs.userId, userId))
      .orderBy(desc(weightLogs.date))
      .limit(limit);
  }

  async createWeightLog(userId: string, weight: number): Promise<WeightLog> {
    const [log] = await db
      .insert(weightLogs)
      .values({ userId, weight, date: new Date() })
      .returning();
    return log;
  }

  async deleteWeightLog(id: number, userId: string): Promise<void> {
    await db
      .delete(weightLogs)
      .where(and(eq(weightLogs.id, id), eq(weightLogs.userId, userId)));
  }

  // Recipes
  async getRecipes(category?: string): Promise<Recipe[]> {
    if (category) {
      return db
        .select()
        .from(recipes)
        .where(eq(recipes.category, category))
        .orderBy(recipes.nameAr);
    }
    return db.select().from(recipes).orderBy(recipes.nameAr);
  }

  async getRecipe(id: number): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    return recipe;
  }

  // Exercises
  async getExercises(userId: string, date: Date): Promise<Exercise[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return db
      .select()
      .from(exercises)
      .where(
        and(
          eq(exercises.userId, userId),
          gte(exercises.date, startOfDay),
          lt(exercises.date, endOfDay)
        )
      )
      .orderBy(desc(exercises.date));
  }

  async getExercisesDateRange(userId: string, startDate: Date, endDate: Date): Promise<Exercise[]> {
    return db
      .select()
      .from(exercises)
      .where(
        and(
          eq(exercises.userId, userId),
          gte(exercises.date, startDate),
          lt(exercises.date, endDate)
        )
      )
      .orderBy(desc(exercises.date));
  }

  async createExercise(userId: string, exerciseData: InsertExercise): Promise<Exercise> {
    const [exercise] = await db
      .insert(exercises)
      .values({ ...exerciseData, userId, date: new Date() })
      .returning();
    return exercise;
  }

  async deleteExercise(id: number, userId: string): Promise<void> {
    await db
      .delete(exercises)
      .where(and(eq(exercises.id, id), eq(exercises.userId, userId)));
  }

  // Challenges
  async getChallenges(): Promise<Challenge[]> {
    return db.select().from(challenges).orderBy(challenges.points);
  }

  async getUserChallenges(userId: string, date: Date): Promise<(UserChallenge & { challenge: Challenge })[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await db
      .select()
      .from(userChallenges)
      .innerJoin(challenges, eq(userChallenges.challengeId, challenges.id))
      .where(
        and(
          eq(userChallenges.userId, userId),
          gte(userChallenges.date, startOfDay),
          lt(userChallenges.date, endOfDay)
        )
      );

    return result.map(r => ({
      ...r.user_challenges,
      challenge: r.challenges
    }));
  }

  async updateUserChallenge(userId: string, challengeId: number, currentValue: number, completed: boolean): Promise<UserChallenge> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [existing] = await db
      .select()
      .from(userChallenges)
      .where(
        and(
          eq(userChallenges.userId, userId),
          eq(userChallenges.challengeId, challengeId),
          gte(userChallenges.date, today),
          lt(userChallenges.date, tomorrow)
        )
      );

    if (existing) {
      const [updated] = await db
        .update(userChallenges)
        .set({ currentValue, completed })
        .where(eq(userChallenges.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userChallenges)
        .values({ userId, challengeId, currentValue, completed, date: today })
        .returning();
      return created;
    }
  }

  // Body Measurements
  async getBodyMeasurements(userId: string, limit: number = 30): Promise<BodyMeasurement[]> {
    return db
      .select()
      .from(bodyMeasurements)
      .where(eq(bodyMeasurements.userId, userId))
      .orderBy(desc(bodyMeasurements.date))
      .limit(limit);
  }

  async createBodyMeasurement(userId: string, measurement: InsertBodyMeasurement): Promise<BodyMeasurement> {
    const [created] = await db
      .insert(bodyMeasurements)
      .values({ ...measurement, userId, date: new Date() })
      .returning();
    return created;
  }

  async deleteBodyMeasurement(id: number, userId: string): Promise<void> {
    await db
      .delete(bodyMeasurements)
      .where(and(eq(bodyMeasurements.id, id), eq(bodyMeasurements.userId, userId)));
  }

  // Daily Habits
  async getDailyHabit(userId: string, date: Date): Promise<DailyHabit | undefined> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [habit] = await db
      .select()
      .from(dailyHabits)
      .where(
        and(
          eq(dailyHabits.userId, userId),
          gte(dailyHabits.date, startOfDay),
          lt(dailyHabits.date, endOfDay)
        )
      );
    return habit;
  }

  async updateDailyHabit(userId: string, habit: InsertDailyHabit, date: Date): Promise<DailyHabit> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [existing] = await db
      .select()
      .from(dailyHabits)
      .where(
        and(
          eq(dailyHabits.userId, userId),
          gte(dailyHabits.date, startOfDay),
          lt(dailyHabits.date, endOfDay)
        )
      );

    if (existing) {
      const [updated] = await db
        .update(dailyHabits)
        .set(habit)
        .where(eq(dailyHabits.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(dailyHabits)
        .values({ ...habit, userId, date: startOfDay })
        .returning();
      return created;
    }
  }

  // Saved Foods
  async getSavedFoods(userId: string): Promise<SavedFood[]> {
    return db.select().from(savedFoods).where(eq(savedFoods.userId, userId)).orderBy(desc(savedFoods.createdAt));
  }

  async createSavedFood(userId: string, food: InsertSavedFood): Promise<SavedFood> {
    const [created] = await db.insert(savedFoods).values({ ...food, userId }).returning();
    return created;
  }

  async deleteSavedFood(id: number, userId: string): Promise<void> {
    await db.delete(savedFoods).where(and(eq(savedFoods.id, id), eq(savedFoods.userId, userId)));
  }

  // Smart Organizer
  async getOrganizerItems(userId: string): Promise<OrganizerItem[]> {
    return db.select().from(organizerItems)
      .where(eq(organizerItems.userId, userId))
      .orderBy(organizerItems.completed, organizerItems.dueAt, desc(organizerItems.createdAt));
  }

  async getOrganizerItem(id: number, userId: string): Promise<OrganizerItem | undefined> {
    const [item] = await db.select().from(organizerItems)
      .where(and(eq(organizerItems.id, id), eq(organizerItems.userId, userId)));
    return item;
  }

  async getDueOrganizerItems(now: Date): Promise<OrganizerItem[]> {
    return db.select().from(organizerItems).where(and(
      eq(organizerItems.completed, false),
      eq(organizerItems.notified, false),
      ne(organizerItems.type, "note"),
      lte(organizerItems.dueAt, now),
    ));
  }

  async createOrganizerItem(userId: string, item: InsertOrganizerItem): Promise<OrganizerItem> {
    const [created] = await db.insert(organizerItems).values({ ...item, userId }).returning();
    return created;
  }

  async updateOrganizerItem(id: number, userId: string, updates: Partial<InsertOrganizerItem> & { notified?: boolean }): Promise<OrganizerItem | undefined> {
    const [updated] = await db.update(organizerItems)
      .set(updates)
      .where(and(eq(organizerItems.id, id), eq(organizerItems.userId, userId)))
      .returning();
    return updated;
  }

  async deleteOrganizerItem(id: number, userId: string): Promise<void> {
    await db.delete(organizerItems).where(and(eq(organizerItems.id, id), eq(organizerItems.userId, userId)));
  }

  async getOrganizerMessages(userId: string, limit = 50): Promise<OrganizerMessage[]> {
    const rows = await db.select().from(organizerMessages)
      .where(eq(organizerMessages.userId, userId))
      .orderBy(desc(organizerMessages.createdAt), desc(organizerMessages.id))
      .limit(limit);
    return rows.reverse();
  }

  async createOrganizerMessage(userId: string, role: string, content: string): Promise<OrganizerMessage> {
    const [created] = await db.insert(organizerMessages).values({ userId, role, content }).returning();
    return created;
  }

  async clearOrganizerMessages(userId: string): Promise<void> {
    await db.delete(organizerMessages).where(eq(organizerMessages.userId, userId));
  }

  // Push subscriptions
  async getPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  }

  async savePushSubscription(userId: string, sub: { endpoint: string; p256dh: string; auth: string }): Promise<PushSubscription> {
    const [saved] = await db.insert(pushSubscriptions)
      .values({ userId, ...sub })
      .onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { userId, p256dh: sub.p256dh, auth: sub.auth } })
      .returning();
    return saved;
  }

  async deletePushSubscription(endpoint: string): Promise<void> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }
}

export const storage = new DatabaseStorage();
