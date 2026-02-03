import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import OpenAI from "openai";
import { seedRestaurants } from "./seed-restaurants";
import { seedRecipes } from "./seed-recipes";
import { seedChallenges } from "./seed-challenges";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Setup Replit Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // Seed data on startup
  await seedRestaurants();
  await seedRecipes();
  await seedChallenges();

  const requireAuth = isAuthenticated;

  // --- Meals ---
  app.get(api.meals.list.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const dateQuery = req.query.date as string | undefined;
    const date = dateQuery ? new Date(dateQuery) : new Date();
    
    const meals = await storage.getMeals(userId, date);
    res.json(meals);
  });

  app.post(api.meals.create.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    try {
      const input = api.meals.create.input.parse(req.body);
      const meal = await storage.createMeal(userId, {
        ...input,
        date: input.date ? new Date(input.date) : new Date()
      });
      res.status(201).json(meal);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.meals.delete.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const id = parseInt(req.params.id);
    await storage.deleteMeal(id, userId);
    res.status(204).send();
  });

  // --- Meal Image Analysis ---
  app.post("/api/analyze-meal-image", requireAuth, async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ success: false, error: "No image provided" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `أنت خبير تغذية. قم بتحليل صورة الطعام وقدم تقديراً للسعرات الحرارية والقيم الغذائية.
أجب بتنسيق JSON فقط بدون أي نص إضافي:
{
  "name": "اسم الوجبة بالعربية",
  "calories": رقم السعرات الحرارية,
  "protein": رقم البروتين بالجرام,
  "carbs": رقم الكربوهيدرات بالجرام,
  "fats": رقم الدهون بالجرام
}`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: image }
              },
              {
                type: "text",
                text: "حلل هذه الوجبة وأعطني القيم الغذائية التقريبية"
              }
            ]
          }
        ],
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content || "";
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const meal = JSON.parse(jsonMatch[0]);
        res.json({ success: true, meal });
      } else {
        res.json({ success: false, error: "Could not parse response" });
      }
    } catch (error: any) {
      console.error("Meal analysis error:", error);
      res.json({ success: false, error: error.message || "Analysis failed" });
    }
  });

  // --- Goals ---
  app.get(api.goals.get.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const goal = await storage.getGoal(userId);
    if (!goal) {
      return res.json({
        calories: 2000,
        protein: 150,
        carbs: 200,
        fats: 65,
        waterGlasses: 8
      });
    }
    res.json(goal);
  });

  app.post(api.goals.update.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    try {
      const input = api.goals.update.input.parse(req.body);
      const goal = await storage.createOrUpdateGoal(userId, input);
      res.json(goal);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // --- Water ---
  app.get(api.water.get.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const dateQuery = req.query.date as string | undefined;
    const date = dateQuery ? new Date(dateQuery) : new Date();
    
    const water = await storage.getWaterIntake(userId, date);
    res.json(water || { glasses: 0 });
  });

  app.post(api.water.update.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    try {
      const input = api.water.update.input.parse(req.body);
      const date = input.date ? new Date(input.date) : new Date();
      const water = await storage.updateWaterIntake(userId, input.glasses, date);
      res.json(water);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // --- Restaurants ---
  app.get(api.restaurants.list.path, requireAuth, async (req, res) => {
    const restaurantsList = await storage.getRestaurants();
    res.json(restaurantsList);
  });

  app.get(api.restaurants.getMenu.path, requireAuth, async (req, res) => {
    const restaurantId = parseInt(req.params.id);
    const menu = await storage.getMenuItems(restaurantId);
    res.json(menu);
  });

  // --- AI Estimate ---
  app.post(api.ai.estimate.path, requireAuth, async (req, res) => {
    try {
      const { query } = api.ai.estimate.input.parse(req.body);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a nutrition expert. Estimate the nutritional content for the provided food description. 
            Return ONLY a JSON object with keys: name (short summary string in Arabic), calories (number), protein (number), carbs (number), fats (number). 
            Do not include any markdown formatting or explanation.`
          },
          {
            role: "user",
            content: query
          }
        ],
      });

      const content = response.choices[0]?.message?.content || "{}";
      const jsonStr = content.replace(/```json/g, "").replace(/```/g, "").trim();
      const estimate = JSON.parse(jsonStr);
      
      if (!estimate.name || typeof estimate.calories !== 'number') {
        throw new Error("Invalid AI response format");
      }

      res.json(estimate);
    } catch (err) {
      console.error("AI Estimate Error:", err);
      res.status(500).json({ message: "Failed to estimate nutrition" });
    }
  });

  // --- Weight Logs ---
  app.get(api.weight.list.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const logs = await storage.getWeightLogs(userId);
    res.json(logs);
  });

  app.post(api.weight.create.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    try {
      const { weight } = api.weight.create.input.parse(req.body);
      const log = await storage.createWeightLog(userId, weight);
      res.status(201).json(log);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.weight.delete.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const id = parseInt(req.params.id);
    await storage.deleteWeightLog(id, userId);
    res.status(204).send();
  });

  // --- Recipes ---
  app.get(api.recipes.list.path, requireAuth, async (req, res) => {
    const category = req.query.category as string | undefined;
    const recipesList = await storage.getRecipes(category);
    res.json(recipesList);
  });

  app.get(api.recipes.get.path, requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const recipe = await storage.getRecipe(id);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    res.json(recipe);
  });

  // --- Exercises ---
  app.get(api.exercises.list.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const dateQuery = req.query.date as string | undefined;
    const date = dateQuery ? new Date(dateQuery) : new Date();
    const exercisesList = await storage.getExercises(userId, date);
    res.json(exercisesList);
  });

  app.post(api.exercises.create.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    try {
      const input = api.exercises.create.input.parse(req.body);
      const exercise = await storage.createExercise(userId, input);
      res.status(201).json(exercise);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.exercises.delete.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const id = parseInt(req.params.id);
    await storage.deleteExercise(id, userId);
    res.status(204).send();
  });

  // --- Challenges ---
  app.get(api.challenges.list.path, requireAuth, async (req, res) => {
    const challengesList = await storage.getChallenges();
    res.json(challengesList);
  });

  app.get(api.challenges.userProgress.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const progress = await storage.getUserChallenges(userId, new Date());
    res.json(progress);
  });

  app.post(api.challenges.update.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    try {
      const { challengeId, currentValue, completed } = api.challenges.update.input.parse(req.body);
      const progress = await storage.updateUserChallenge(userId, challengeId, currentValue, completed);
      res.json(progress);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // --- Weekly Stats ---
  app.get(api.stats.weekly.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const [mealsList, waterList, exercisesList] = await Promise.all([
      storage.getMealsDateRange(userId, startDate, endDate),
      storage.getWaterIntakeDateRange(userId, startDate, endDate),
      storage.getExercisesDateRange(userId, startDate, endDate),
    ]);

    // Group by date
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      days.push(d.toISOString().split('T')[0]);
    }

    const result = {
      calories: days.map(date => ({
        date,
        value: mealsList.filter(m => m.date.toISOString().split('T')[0] === date).reduce((s, m) => s + m.calories, 0)
      })),
      protein: days.map(date => ({
        date,
        value: mealsList.filter(m => m.date.toISOString().split('T')[0] === date).reduce((s, m) => s + m.protein, 0)
      })),
      carbs: days.map(date => ({
        date,
        value: mealsList.filter(m => m.date.toISOString().split('T')[0] === date).reduce((s, m) => s + m.carbs, 0)
      })),
      fats: days.map(date => ({
        date,
        value: mealsList.filter(m => m.date.toISOString().split('T')[0] === date).reduce((s, m) => s + m.fats, 0)
      })),
      water: days.map(date => ({
        date,
        value: waterList.find(w => w.date.toISOString().split('T')[0] === date)?.glasses || 0
      })),
      exerciseCalories: days.map(date => ({
        date,
        value: exercisesList.filter(e => e.date.toISOString().split('T')[0] === date).reduce((s, e) => s + e.caloriesBurned, 0)
      })),
    };

    res.json(result);
  });

  // --- Body Measurements ---
  app.get(api.bodyMeasurements.list.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const measurements = await storage.getBodyMeasurements(userId);
    res.json(measurements);
  });

  app.post(api.bodyMeasurements.create.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    try {
      const input = api.bodyMeasurements.create.input.parse(req.body);
      const measurement = await storage.createBodyMeasurement(userId, input);
      res.status(201).json(measurement);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.bodyMeasurements.delete.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const id = parseInt(req.params.id);
    await storage.deleteBodyMeasurement(id, userId);
    res.status(204).send();
  });

  // --- Daily Habits ---
  app.get(api.dailyHabits.get.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const dateQuery = req.query.date as string | undefined;
    const date = dateQuery ? new Date(dateQuery) : new Date();
    const habit = await storage.getDailyHabit(userId, date);
    res.json(habit || null);
  });

  app.post(api.dailyHabits.update.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    try {
      const { date: dateStr, ...habitData } = api.dailyHabits.update.input.parse(req.body);
      const date = dateStr ? new Date(dateStr) : new Date();
      const habit = await storage.updateDailyHabit(userId, habitData, date);
      res.json(habit);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  return httpServer;
}
