import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { Exercise, InsertExercise } from "@shared/schema";

export function useExercises(date: Date) {
  const dateStr = format(date, "yyyy-MM-dd");
  return useQuery<Exercise[]>({
    queryKey: ["/api/exercises", dateStr],
    queryFn: async () => {
      const res = await fetch(`/api/exercises?date=${dateStr}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch exercises");
      return res.json();
    },
  });
}

export function useCreateExercise() {
  return useMutation({
    mutationFn: async (exercise: InsertExercise) => {
      const res = await apiRequest("POST", "/api/exercises", exercise);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
    },
  });
}

export function useDeleteExercise() {
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/exercises/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
    },
  });
}
