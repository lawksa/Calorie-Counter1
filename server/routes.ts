import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import OpenAI from "openai";
import { seedRestaurants } from "./seed-restaurants";

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

  // Seed restaurants on startup
  await seedRestaurants();

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

  return httpServer;
}
