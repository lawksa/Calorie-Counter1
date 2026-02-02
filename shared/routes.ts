import { z } from 'zod';
import { insertMealSchema, insertGoalSchema, meals, goals } from './schema';

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
        date: z.string().optional(), // ISO string YYYY-MM-DD
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
        404: errorSchemas.notFound, // Or just return defaults if not found
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
export type EstimateInput = z.infer<typeof api.ai.estimate.input>;
export type EstimateResponse = z.infer<typeof api.ai.estimate.responses[200]>;
