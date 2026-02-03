import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { WeightLog } from "@shared/schema";

export function useWeightLogs() {
  return useQuery<WeightLog[]>({
    queryKey: ["/api/weight"],
  });
}

export function useCreateWeightLog() {
  return useMutation({
    mutationFn: async (weight: number) => {
      const res = await apiRequest("POST", "/api/weight", { weight });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weight"] });
    },
  });
}

export function useDeleteWeightLog() {
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/weight/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weight"] });
    },
  });
}
