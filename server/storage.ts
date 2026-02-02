import { 
  users, goals, meals, waterIntake, restaurants, menuItems,
  type User, type InsertUser, type Goal, type InsertGoal, 
  type Meal, type InsertMeal, type WaterIntake, type Restaurant, type MenuItem 
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lt, desc } from "drizzle-orm";

export interface IStorage {
  // Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Goals
  getGoal(userId: string): Promise<Goal | undefined>;
  createOrUpdateGoal(userId: string, goal: InsertGoal): Promise<Goal>;

  // Meals
  getMeals(userId: string, date: Date): Promise<Meal[]>;
  createMeal(userId: string, meal: InsertMeal & { date?: Date }): Promise<Meal>;
  deleteMeal(id: number, userId: string): Promise<void>;

  // Water
  getWaterIntake(userId: string, date: Date): Promise<WaterIntake | undefined>;
  updateWaterIntake(userId: string, glasses: number, date: Date): Promise<WaterIntake>;

  // Restaurants
  getRestaurants(): Promise<Restaurant[]>;
  getMenuItems(restaurantId: number): Promise<MenuItem[]>;
}

export class DatabaseStorage implements IStorage {
  // Auth methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
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
  async getRestaurants(): Promise<Restaurant[]> {
    return db.select().from(restaurants).orderBy(restaurants.name);
  }

  async getMenuItems(restaurantId: number): Promise<MenuItem[]> {
    return db
      .select()
      .from(menuItems)
      .where(eq(menuItems.restaurantId, restaurantId))
      .orderBy(menuItems.category, menuItems.name);
  }
}

export const storage = new DatabaseStorage();
