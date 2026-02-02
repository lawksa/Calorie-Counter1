import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type GoalInput } from "@shared/routes";

// ============================================
// GOAL HOOKS
// ============================================

export function useGoals() {
  return useQuery({
    queryKey: [api.goals.get.path],
    queryFn: async () => {
      const res = await fetch(api.goals.get.path, { credentials: "include" });
      
      // If 404, we might just want to return default goals or null to handle in UI
      if (res.status === 404) return null;
      
      if (!res.ok) throw new Error("Failed to fetch goals");
      return api.goals.get.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateGoals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: GoalInput) => {
      const validated = api.goals.update.input.parse(data);
      const res = await fetch(api.goals.update.path, {
        method: api.goals.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update goals");
      return api.goals.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.goals.get.path] });
    },
  });
}
