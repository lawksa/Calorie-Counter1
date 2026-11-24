import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./auth";
import OpenAI from "openai";
import { seedRestaurants } from "./seed-restaurants";
import { seedRecipes } from "./seed-recipes";
import { seedChallenges } from "./seed-challenges";
import { registerOrganizerRoutes } from "./organizer";
import { registerPushRoutes } from "./push";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "missing-openai-key",
  baseURL: process.env.OPENAI_BASE_URL || undefined,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Single-user mode (no sign-in)
  await setupAuth(app);

  // Seed data on startup
  await seedRestaurants();
  await seedRecipes();
  await seedChallenges();

  const requireAuth = isAuthenticated;

  // --- Smart Organizer (AI assistant) ---
  registerOrganizerRoutes(app, requireAuth, openai);
  await registerPushRoutes(app, requireAuth);

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
        model: "gpt-4o-mini",
        messages: [
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
                text: `أنت خبير تغذية. قم بتحليل صورة الطعام وقدم تقديراً للسعرات الحرارية والقيم الغذائية.
أجب بتنسيق JSON فقط بدون أي نص إضافي:
{
  "name": "اسم الوجبة بالعربية",
  "calories": رقم السعرات الحرارية,
  "protein": رقم البروتين بالجرام,
  "carbs": رقم الكربوهيدرات بالجرام,
  "fats": رقم الدهون بالجرام
}`
              }
            ]
          }
        ],
        max_tokens: 500
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
    const userId = (req.user as any).claims.sub;
    const restaurantsList = await storage.getRestaurants(userId);
    res.json(restaurantsList);
  });

  app.get(api.restaurants.getMenu.path, requireAuth, async (req, res) => {
    const restaurantId = parseInt(req.params.id);
    const menu = await storage.getMenuItems(restaurantId);
    res.json(menu);
  });

  // AI Restaurant Search
  app.post("/api/restaurants/ai-search", requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    try {
      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ message: "الرجاء إدخال استفسار" });
      }

      // Get all restaurants for context
      const allRestaurants = await storage.getRestaurants(userId);
      const restaurantNames = allRestaurants.map(r => `${r.nameAr} (${r.name}) - ${r.category}`).join('\n');

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `أنت مساعد للبحث عن المطاعم في السعودية. لديك قائمة بالمطاعم المتاحة:

${restaurantNames}

عندما يسأل المستخدم عن مطعم أو نوع طعام:
1. ابحث في القائمة عن المطاعم المناسبة
2. إذا وجدت مطاعم مناسبة، أرجع أسماءها بالضبط كما هي في القائمة
3. إذا لم تجد، اقترح اسم مطعم جديد يمكن إضافته

أرجع الإجابة بصيغة JSON فقط:
{
  "found": [{"name": "اسم المطعم بالضبط", "reason": "سبب الاقتراح"}],
  "suggestions": [{"name": "اسم مطعم جديد", "category": "fast_food|saudi|coffee|healthy|custom"}]
}`
          },
          {
            role: "user",
            content: query
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content || '{"found":[],"suggestions":[]}';
      const result = JSON.parse(content);

      // Match found restaurants with actual restaurant data
      const matchedRestaurants = allRestaurants.filter(r => 
        result.found?.some((f: any) => 
          r.nameAr.includes(f.name) || r.name.toLowerCase().includes(f.name.toLowerCase()) ||
          f.name.includes(r.nameAr) || f.name.toLowerCase().includes(r.name.toLowerCase())
        )
      );

      res.json({
        restaurants: matchedRestaurants,
        suggestions: result.suggestions || [],
        query
      });
    } catch (err) {
      console.error("AI restaurant search error:", err);
      res.status(500).json({ message: "فشل في البحث" });
    }
  });

  // Create custom restaurant
  app.post("/api/restaurants", requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    try {
      const { name, category } = req.body;
      if (!name || !category) {
        return res.status(400).json({ message: "الاسم والفئة مطلوبان" });
      }
      const restaurant = await storage.createRestaurant(userId, {
        name,
        nameAr: name,
        category,
        logo: null,
      });
      res.json(restaurant);
    } catch (err) {
      console.error("Create restaurant error:", err);
      res.status(500).json({ message: "فشل في إنشاء المطعم" });
    }
  });

  // Toggle restaurant favorite
  app.post("/api/restaurants/:id/favorite", requireAuth, async (req, res) => {
    const userId = (req.user as any).claims.sub;
    const restaurantId = parseInt(req.params.id);
    try {
      const restaurant = await storage.toggleRestaurantFavorite(restaurantId, userId);
      res.json(restaurant);
    } catch (err) {
      console.error("Toggle favorite error:", err);
      res.status(500).json({ message: "فشل في تحديث المفضلة" });
    }
  });

  // Add menu item to restaurant
  app.post("/api/restaurants/:id/menu", requireAuth, async (req, res) => {
    const restaurantId = parseInt(req.params.id);
    try {
      const { name, calories, protein, carbs, fats, category } = req.body;
      if (!name || calories === undefined) {
        return res.status(400).json({ message: "الاسم والسعرات مطلوبان" });
      }
      const menuItem = await storage.createMenuItem({
        restaurantId,
        name,
        nameAr: name,
        calories: parseInt(calories) || 0,
        protein: parseInt(protein) || 0,
        carbs: parseInt(carbs) || 0,
        fats: parseInt(fats) || 0,
        category: category || "main",
      });
      res.json(menuItem);
    } catch (err) {
      console.error("Create menu item error:", err);
      res.status(500).json({ message: "فشل في إضافة الوجبة" });
    }
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
    const [challengesList, goal, meals, water, exercises, dailyHabits] = await Promise.all([
      storage.getChallenges(),
      storage.getGoal(userId),
      storage.getMeals(userId, today),
      storage.getWaterIntake(userId, today),
      storage.getExercises(userId, today),
      storage.getDailyHabit(userId, today),
    ]);
    
    const calorieGoal = goal?.calories || 2000;
    const proteinGoal = goal?.protein || 150;
    const waterGoal = goal?.waterGlasses || 8;
    const vegetablesServings = dailyHabits?.vegetablesServings || 0;
    
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
          // Track vegetables from daily habits
          currentValue = vegetablesServings;
          completed = currentValue >= challenge.targetValue;
          break;
        case 'no_sugar':
          // This needs manual tracking - keep at 0 unless manually set
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

  return httpServer;
}
