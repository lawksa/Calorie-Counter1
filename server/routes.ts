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

      // Validate image format
      if (!image.startsWith('data:image/')) {
        return res.status(400).json({ success: false, error: "Invalid image format" });
      }

      console.log("Analyzing meal image, size:", Math.round(image.length / 1024), "KB");

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
                image_url: { 
                  url: image,
                  detail: "low"
                }
              },
              {
                type: "text",
                text: "حلل هذه الوجبة وأعطني القيم الغذائية التقريبية"
              }
            ]
          }
        ],
        max_completion_tokens: 500
      });

      const content = response.choices[0]?.message?.content || "";
      console.log("AI response:", content);
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const meal = JSON.parse(jsonMatch[0]);
        res.json({ success: true, meal });
      } else {
        console.error("Could not parse JSON from response:", content);
        res.json({ success: false, error: "تعذر تحليل الصورة، حاول مجدداً" });
      }
    } catch (error: any) {
      console.error("Meal analysis error:", error?.message || error);
      console.error("Full error:", JSON.stringify(error, null, 2));
      
      // Check for specific error types
      if (error?.status === 429) {
        res.json({ success: false, error: "الخدمة مشغولة حالياً، حاول بعد قليل" });
      } else if (error?.status === 400) {
        res.json({ success: false, error: "صيغة الصورة غير مدعومة" });
      } else {
        res.json({ success: false, error: "فشل في تحليل الصورة، حاول مجدداً" });
      }
    }
  });

  // --- Barcode Lookup ---
  app.get("/api/barcode/:barcode", requireAuth, async (req, res) => {
    try {
      const { barcode } = req.params;
      
      // Use Open Food Facts API (free, no API key needed)
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
      );
      const data = await response.json();

      if (data.status === 1 && data.product) {
        const product = data.product;
        const nutriments = product.nutriments || {};
        
        // Get product name (prefer Arabic if available)
        const name = product.product_name_ar || 
                     product.product_name || 
                     product.generic_name_ar ||
                     product.generic_name ||
                     "منتج غذائي";

        // Get nutritional values per 100g or per serving
        const servingSize = product.serving_size || "100g";
        const calories = Math.round(nutriments["energy-kcal_100g"] || nutriments["energy-kcal"] || 0);
        const protein = Math.round(nutriments.proteins_100g || nutriments.proteins || 0);
        const carbs = Math.round(nutriments.carbohydrates_100g || nutriments.carbohydrates || 0);
        const fats = Math.round(nutriments.fat_100g || nutriments.fat || 0);

        res.json({
          success: true,
          product: {
            name,
            calories,
            protein,
            carbs,
            fats,
            servingSize: `لكل ${servingSize}`,
          }
        });
      } else {
        res.json({ success: false, error: "Product not found" });
      }
    } catch (error: any) {
      console.error("Barcode lookup error:", error);
      res.json({ success: false, error: error.message || "Lookup failed" });
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

  // --- Weekly Summary for Calendar ---
  app.get("/api/weekly-summary", requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const dateQuery = req.query.date as string | undefined;
    const centerDate = dateQuery ? new Date(dateQuery) : new Date();
    
    // Get week start (Saturday) and end (Friday)
    const dayOfWeek = centerDate.getDay();
    const daysFromSaturday = (dayOfWeek + 1) % 7;
    const weekStart = new Date(centerDate);
    weekStart.setDate(centerDate.getDate() - daysFromSaturday);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    
    try {
      const [mealsList, waterList, goal] = await Promise.all([
        storage.getMealsDateRange(userId, weekStart, weekEnd),
        storage.getWaterIntakeDateRange(userId, weekStart, weekEnd),
        storage.getGoal(userId)
      ]);
      
      const calorieGoal = goal?.calories || 2000;
      const waterGoal = goal?.waterGlasses || 8;
      
      // Build daily summaries
      const dailySummaries: Record<string, { 
        calories: number; 
        calorieGoal: number;
        water: number;
        waterGoal: number;
        mealsCount: number;
        adherence: number;
      }> = {};
      
      for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        const dateKey = day.toISOString().split('T')[0];
        
        const dayMeals = mealsList.filter(m => 
          m.date.toISOString().split('T')[0] === dateKey
        );
        const dayWater = waterList.find(w => 
          w.date.toISOString().split('T')[0] === dateKey
        );
        
        const totalCalories = dayMeals.reduce((sum, m) => sum + m.calories, 0);
        const waterGlasses = dayWater?.glasses || 0;
        
        // Calculate adherence score (0-100)
        // Within 10% of calorie goal = good, water goal met = good
        const calorieAdherence = totalCalories > 0 
          ? Math.max(0, 100 - Math.abs(totalCalories - calorieGoal) / calorieGoal * 100)
          : 0;
        const waterAdherence = Math.min(100, (waterGlasses / waterGoal) * 100);
        const adherence = Math.round((calorieAdherence + waterAdherence) / 2);
        
        dailySummaries[dateKey] = {
          calories: totalCalories,
          calorieGoal,
          water: waterGlasses,
          waterGoal,
          mealsCount: dayMeals.length,
          adherence
        };
      }
      
      res.json(dailySummaries);
    } catch (error) {
      console.error("Weekly summary error:", error);
      res.status(500).json({ message: "Failed to get weekly summary" });
    }
  });

  // --- Achievements/Streak ---
  app.get("/api/achievements/stats", requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    
    try {
      const goal = await storage.getGoal(userId);
      const calorieGoal = goal?.calories || 2000;
      const waterGoal = goal?.waterGlasses || 8;
      
      // Get all data from the past 365 days
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 365);
      startDate.setHours(0, 0, 0, 0);
      
      const [mealsList, waterList] = await Promise.all([
        storage.getMealsDateRange(userId, startDate, endDate),
        storage.getWaterIntakeDateRange(userId, startDate, endDate)
      ]);
      
      // Build daily data map
      const dailyData: Record<string, { calories: number; water: number; mealsCount: number }> = {};
      
      for (const meal of mealsList) {
        const dateKey = meal.date.toISOString().split('T')[0];
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { calories: 0, water: 0, mealsCount: 0 };
        }
        dailyData[dateKey].calories += meal.calories;
        dailyData[dateKey].mealsCount++;
      }
      
      for (const water of waterList) {
        const dateKey = water.date.toISOString().split('T')[0];
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { calories: 0, water: 0, mealsCount: 0 };
        }
        dailyData[dateKey].water = water.glasses;
      }
      
      // Calculate adherence for each day
      const isPerfectDay = (data: { calories: number; water: number; mealsCount: number }) => {
        if (data.mealsCount === 0) return false;
        
        // Calories within 20% of goal (not too over or under)
        const caloriesDiff = Math.abs(data.calories - calorieGoal) / calorieGoal;
        const caloriesOk = caloriesDiff <= 0.2;
        
        // Water at least 70% of goal
        const waterOk = data.water >= waterGoal * 0.7;
        
        return caloriesOk && waterOk;
      };
      
      // Calculate current streak (consecutive perfect days ending today or yesterday)
      let currentStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let i = 0; i <= 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateKey = checkDate.toISOString().split('T')[0];
        const data = dailyData[dateKey];
        
        if (data && isPerfectDay(data)) {
          currentStreak++;
        } else if (i === 0) {
          // Today might not be complete, check yesterday
          continue;
        } else {
          break;
        }
      }
      
      // Calculate total perfect days
      let totalPerfectDays = 0;
      for (const [dateKey, data] of Object.entries(dailyData)) {
        if (isPerfectDay(data)) {
          totalPerfectDays++;
        }
      }
      
      res.json({
        currentStreak,
        totalPerfectDays,
        calorieGoal,
        waterGoal
      });
    } catch (error) {
      console.error("Achievements stats error:", error);
      res.status(500).json({ message: "Failed to get achievements stats" });
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
    const today = new Date();
    
    // Get all data needed to calculate progress
    const [challengesList, goal, meals, water, exercises] = await Promise.all([
      storage.getChallenges(),
      storage.getGoal(userId),
      storage.getMeals(userId, today),
      storage.getWaterIntake(userId, today),
      storage.getExercises(userId, today),
    ]);
    
    const calorieGoal = goal?.calories || 2000;
    const proteinGoal = goal?.protein || 150;
    const waterGoal = goal?.waterGlasses || 8;
    
    // Calculate actual values
    const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
    const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
    const mealsCount = meals.length;
    const waterGlasses = water?.glasses || 0;
    const totalExerciseMinutes = exercises.reduce((sum, e) => sum + (e.duration || 0), 0);
    const totalCaloriesBurned = exercises.reduce((sum, e) => sum + (e.caloriesBurned || 0), 0);
    
    // Build progress for each challenge
    const progress = challengesList.map(challenge => {
      let currentValue = 0;
      let completed = false;
      
      switch (challenge.type) {
        case 'water':
          // Water is now stored in 10ml units, target is 8 "glasses" (we need to convert)
          // But target is 8 glasses which means 800ml = 80 units of 10ml
          currentValue = Math.floor(waterGlasses / 10); // Convert to "glasses" (100ml each)
          completed = currentValue >= challenge.targetValue;
          break;
        case 'calories':
          // Stay under calorie goal - completed if consumed <= goal
          currentValue = totalCalories <= calorieGoal ? 1 : 0;
          completed = currentValue >= challenge.targetValue;
          break;
        case 'protein':
          // Hit protein target - completed if consumed >= goal
          currentValue = totalProtein >= proteinGoal ? 1 : 0;
          completed = currentValue >= challenge.targetValue;
          break;
        case 'meals':
          currentValue = mealsCount;
          completed = currentValue >= challenge.targetValue;
          break;
        case 'exercise':
          currentValue = totalExerciseMinutes;
          completed = currentValue >= challenge.targetValue;
          break;
        case 'exercise_calories':
          currentValue = totalCaloriesBurned;
          completed = currentValue >= challenge.targetValue;
          break;
        case 'vegetables':
        case 'no_sugar':
          // These need manual tracking - keep at 0 unless manually set
          currentValue = 0;
          completed = false;
          break;
      }
      
      return {
        id: 0, // Will be set by actual record if exists
        challengeId: challenge.id,
        currentValue,
        completed,
        challenge,
      };
    });
    
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

  // --- Saved Foods ---
  app.get(api.savedFoods.list.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const foods = await storage.getSavedFoods(userId);
    res.json(foods);
  });

  app.post(api.savedFoods.create.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    try {
      const input = api.savedFoods.create.input.parse(req.body);
      const food = await storage.createSavedFood(userId, input);
      res.status(201).json(food);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.savedFoods.delete.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const id = parseInt(req.params.id);
    await storage.deleteSavedFood(id, userId);
    res.status(204).send();
  });

  // --- User Profile & Username ---
  app.get("/api/profile", requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const user = await storage.getUserProfile(userId);
    res.json(user);
  });

  app.put("/api/profile/username", requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    try {
      const { username } = req.body;
      if (!username || username.length < 3) {
        return res.status(400).json({ message: "اسم المستخدم يجب أن يكون 3 أحرف على الأقل" });
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({ message: "اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام فقط" });
      }
      const user = await storage.updateUsername(userId, username);
      res.json(user);
    } catch (err: any) {
      if (err.message === 'Username already taken') {
        return res.status(400).json({ message: "اسم المستخدم مستخدم بالفعل" });
      }
      throw err;
    }
  });

  // --- Users Search ---
  app.get("/api/users/search", requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const query = req.query.q as string || '';
    const users = await storage.searchUsers(query, userId);
    res.json(users);
  });

  // --- Friends ---
  app.get("/api/friends", requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const friends = await storage.getFriends(userId);
    res.json(friends);
  });

  app.get("/api/friends/requests", requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const requests = await storage.getFriendRequests(userId);
    res.json(requests);
  });

  app.post("/api/friends/request", requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    try {
      const { username } = req.body;
      if (!username) {
        return res.status(400).json({ message: "اسم المستخدم مطلوب" });
      }
      const friendship = await storage.sendFriendRequest(userId, username);
      res.status(201).json(friendship);
    } catch (err: any) {
      if (err.message === 'User not found') {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }
      if (err.message === 'Friend request already exists') {
        return res.status(400).json({ message: "طلب الصداقة موجود بالفعل" });
      }
      if (err.message === 'Cannot send friend request to yourself') {
        return res.status(400).json({ message: "لا يمكنك إرسال طلب صداقة لنفسك" });
      }
      throw err;
    }
  });

  app.post("/api/friends/respond/:id", requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const requestId = parseInt(req.params.id);
    const { accept } = req.body;
    const friendship = await storage.respondToFriendRequest(userId, requestId, accept === true);
    res.json(friendship);
  });

  app.delete("/api/friends/:friendId", requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const friendId = req.params.friendId;
    await storage.removeFriend(userId, friendId);
    res.status(204).send();
  });

  // --- Friend Challenges ---
  app.get("/api/friend-challenges", requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const challenges = await storage.getFriendChallenges(userId);
    res.json(challenges);
  });

  app.post("/api/friend-challenges", requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    try {
      const { title, description, type, targetValue, startDate, endDate, participantIds } = req.body;
      if (!title || !type || !targetValue || !startDate || !endDate) {
        return res.status(400).json({ message: "جميع الحقول مطلوبة" });
      }
      const challenge = await storage.createFriendChallenge(userId, {
        creatorId: userId,
        title,
        description,
        type,
        targetValue,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'active'
      }, participantIds || []);
      res.status(201).json(challenge);
    } catch (err) {
      throw err;
    }
  });

  app.put("/api/friend-challenges/:id/progress", requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const challengeId = parseInt(req.params.id);
    const { value } = req.body;
    const participant = await storage.updateChallengeProgress(userId, challengeId, value);
    res.json(participant);
  });

  app.get("/api/friend-challenges/:id/leaderboard", requireAuth, async (req, res) => {
    const challengeId = parseInt(req.params.id);
    const leaderboard = await storage.getChallengeLeaderboard(challengeId);
    res.json(leaderboard);
  });

  return httpServer;
}
