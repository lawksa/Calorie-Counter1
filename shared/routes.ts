import { z } from 'zod';
import { insertMealSchema, insertGoalSchema, insertWaterIntakeSchema, meals, goals, waterIntake, restaurants, menuItems } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  meals: {
    list: {
      method: 'GET' as const,
      path: '/api/meals',
      input: z.object({
        date: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof meals.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/meals',
      input: insertMealSchema.extend({ date: z.string().optional() }),
      responses: {
        201: z.custom<typeof meals.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/meals/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  goals: {
    get: {
      method: 'GET' as const,
      path: '/api/goals',
      responses: {
        200: z.custom<typeof goals.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'POST' as const,
      path: '/api/goals',
      input: insertGoalSchema,
      responses: {
        200: z.custom<typeof goals.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  water: {
    get: {
      method: 'GET' as const,
      path: '/api/water',
      input: z.object({
        date: z.string().optional(),
      }).optional(),
      responses: {
        200: z.custom<typeof waterIntake.$inferSelect>(),
      },
    },
    update: {
      method: 'POST' as const,
      path: '/api/water',
      input: z.object({
        glasses: z.number().min(0),
        date: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof waterIntake.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  restaurants: {
    list: {
      method: 'GET' as const,
      path: '/api/restaurants',
      responses: {
        200: z.array(z.custom<typeof restaurants.$inferSelect>()),
      },
    },
    getMenu: {
      method: 'GET' as const,
      path: '/api/restaurants/:id/menu',
      responses: {
        200: z.array(z.custom<typeof menuItems.$inferSelect>()),
      },
    },
  },
  ai: {
    estimate: {
      method: 'POST' as const,
      path: '/api/ai/estimate',
      input: z.object({
        query: z.string().min(3),
      }),
      responses: {
        200: z.object({
          name: z.string(),
          calories: z.number(),
          protein: z.number(),
          carbs: z.number(),
          fats: z.number(),
        }),
        500: errorSchemas.internal,
      },
    },
  },
};

// ============================================
// HELPER
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPES
// ============================================
export type MealInput = z.infer<typeof api.meals.create.input>;
export type GoalInput = z.infer<typeof api.goals.update.input>;
export type WaterInput = z.infer<typeof api.water.update.input>;
export type EstimateInput = z.infer<typeof api.ai.estimate.input>;
export type EstimateResponse = z.infer<typeof api.ai.estimate.responses[200]>;
