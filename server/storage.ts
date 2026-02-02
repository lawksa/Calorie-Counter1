import { users, goals, meals, type User, type InsertUser, type Goal, type InsertGoal, type Meal, type InsertMeal } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lt, desc } from "drizzle-orm";

export interface IStorage {
  // Auth (Required by Auth Integration, though implemented in auth/storage.ts usually, keeping here if needed or for reference)
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
}

export class DatabaseStorage implements IStorage {
  // Auth methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Note: Replit Auth uses email mostly, but if we have username column
    const [user] = await db.select().from(users).where(eq(users.email, username)); // Mapping email to username query for compatibility if needed
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // This is handled by Replit Auth integration usually, but implementing for completeness
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
    // Filter by day
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
}

export const storage = new DatabaseStorage();
