import { useQuery } from "@tanstack/react-query";
import type { Recipe } from "@shared/schema";

export function useRecipes(category?: string) {
  return useQuery<Recipe[]>({
    queryKey: ["/api/recipes", category],
    queryFn: async () => {
      const url = category ? `/api/recipes?category=${category}` : "/api/recipes";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch recipes");
      return res.json();
    },
  });
}

export function useRecipe(id: number) {
  return useQuery<Recipe>({
    queryKey: ["/api/recipes", id],
    queryFn: async () => {
      const res = await fetch(`/api/recipes/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch recipe");
      return res.json();
    },
    enabled: !!id,
  });
}
