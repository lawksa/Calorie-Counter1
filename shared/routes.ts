import { z } from 'zod';
import { 
  insertMealSchema, insertGoalSchema, insertWaterIntakeSchema, insertWeightLogSchema, insertExerciseSchema,
  insertBodyMeasurementSchema, insertDailyHabitSchema,
  meals, goals, waterIntake, restaurants, menuItems, weightLogs, recipes, exercises, challenges, userChallenges,
  bodyMeasurements, dailyHabits
} from './schema';

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
  weight: {
    list: {
      method: 'GET' as const,
      path: '/api/weight',
      responses: {
        200: z.array(z.custom<typeof weightLogs.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/weight',
      input: z.object({
        weight: z.number().min(20000).max(300000), // grams (20kg - 300kg)
      }),
      responses: {
        201: z.custom<typeof weightLogs.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/weight/:id',
      responses: {
        204: z.void(),
      },
    },
  },
  recipes: {
    list: {
      method: 'GET' as const,
      path: '/api/recipes',
      input: z.object({
        category: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof recipes.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/recipes/:id',
      responses: {
        200: z.custom<typeof recipes.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  exercises: {
    list: {
      method: 'GET' as const,
      path: '/api/exercises',
      input: z.object({
        date: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof exercises.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/exercises',
      input: insertExerciseSchema,
      responses: {
        201: z.custom<typeof exercises.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/exercises/:id',
      responses: {
        204: z.void(),
      },
    },
  },
  challenges: {
    list: {
      method: 'GET' as const,
      path: '/api/challenges',
      responses: {
        200: z.array(z.custom<typeof challenges.$inferSelect>()),
      },
    },
    userProgress: {
      method: 'GET' as const,
      path: '/api/challenges/progress',
      responses: {
        200: z.array(z.object({
          id: z.number(),
          challengeId: z.number(),
          currentValue: z.number(),
          completed: z.boolean(),
          challenge: z.custom<typeof challenges.$inferSelect>(),
        })),
      },
    },
    update: {
      method: 'POST' as const,
      path: '/api/challenges/progress',
      input: z.object({
        challengeId: z.number(),
        currentValue: z.number(),
        completed: z.boolean(),
      }),
      responses: {
        200: z.custom<typeof userChallenges.$inferSelect>(),
      },
    },
  },
  stats: {
    weekly: {
      method: 'GET' as const,
      path: '/api/stats/weekly',
      responses: {
        200: z.object({
          calories: z.array(z.object({ date: z.string(), value: z.number() })),
          protein: z.array(z.object({ date: z.string(), value: z.number() })),
          carbs: z.array(z.object({ date: z.string(), value: z.number() })),
          fats: z.array(z.object({ date: z.string(), value: z.number() })),
          water: z.array(z.object({ date: z.string(), value: z.number() })),
          exerciseCalories: z.array(z.object({ date: z.string(), value: z.number() })),
        }),
      },
    },
  },
  bodyMeasurements: {
    list: {
      method: 'GET' as const,
      path: '/api/body-measurements',
      responses: {
        200: z.array(z.custom<typeof bodyMeasurements.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/body-measurements',
      input: insertBodyMeasurementSchema,
      responses: {
        201: z.custom<typeof bodyMeasurements.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/body-measurements/:id',
      responses: {
        204: z.void(),
      },
    },
  },
  dailyHabits: {
    get: {
      method: 'GET' as const,
      path: '/api/daily-habits',
      input: z.object({
        date: z.string().optional(),
      }).optional(),
      responses: {
        200: z.custom<typeof dailyHabits.$inferSelect>().nullable(),
      },
    },
    update: {
      method: 'POST' as const,
      path: '/api/daily-habits',
      input: insertDailyHabitSchema.extend({
        date: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof dailyHabits.$inferSelect>(),
        400: errorSchemas.validation,
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
