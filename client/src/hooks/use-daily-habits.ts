import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { DailyHabit, InsertDailyHabit } from "@shared/schema";

export function useDailyHabit(date?: Date) {
  const dateStr = date?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0];
  
  return useQuery<DailyHabit | null>({
    queryKey: ["/api/daily-habits", dateStr],
    queryFn: async () => {
      const res = await fetch(`/api/daily-habits?date=${dateStr}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch daily habits");
      return res.json();
    },
  });
}

export function useUpdateDailyHabit() {
  return useMutation({
    mutationFn: async (data: InsertDailyHabit & { date?: string }) => {
      const res = await apiRequest("POST", "/api/daily-habits", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return Array.isArray(query.queryKey) && query.queryKey[0] === "/api/daily-habits";
        }
      });
      // Also invalidate challenges progress since vegetables are tracked from daily habits
      queryClient.invalidateQueries({ queryKey: ["/api/challenges/progress"] });
    },
  });
}
