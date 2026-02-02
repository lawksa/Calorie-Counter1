import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type MealInput } from "@shared/routes";
import { format } from "date-fns";

// ============================================
// MEAL HOOKS
// ============================================

export function useMeals(date: Date) {
  const dateString = format(date, "yyyy-MM-dd");
  return useQuery({
    queryKey: [api.meals.list.path, dateString],
    queryFn: async () => {
      const url = `${api.meals.list.path}?date=${dateString}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch meals");
      return api.meals.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: MealInput) => {
      const validated = api.meals.create.input.parse(data);
      const res = await fetch(api.meals.create.path, {
        method: api.meals.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.meals.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create meal");
      }
      return api.meals.create.responses[201].parse(await res.json());
    },
    onSuccess: (newMeal) => {
      // Invalidate the specific date list that this meal belongs to
      const dateString = format(new Date(newMeal.date), "yyyy-MM-dd");
      queryClient.invalidateQueries({ queryKey: [api.meals.list.path, dateString] });
      queryClient.invalidateQueries({ queryKey: [api.meals.list.path] }); // General invalidation just in case
    },
  });
}

export function useDeleteMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.meals.delete.path, { id });
      const res = await fetch(url, {
        method: api.meals.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete meal");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.meals.list.path] });
    },
  });
}

// ============================================
// AI ESTIMATE HOOK
// ============================================

export function useEstimateCalories() {
  return useMutation({
    mutationFn: async (query: string) => {
      const validated = api.ai.estimate.input.parse({ query });
      const res = await fetch(api.ai.estimate.path, {
        method: api.ai.estimate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to estimate calories");
      return api.ai.estimate.responses[200].parse(await res.json());
    },
  });
}
