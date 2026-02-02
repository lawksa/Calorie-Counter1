import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type WaterInput } from "@shared/routes";
import { format } from "date-fns";

export function useWaterIntake(date: Date) {
  const dateString = format(date, "yyyy-MM-dd");
  return useQuery({
    queryKey: [api.water.get.path, dateString],
    queryFn: async () => {
      const url = `${api.water.get.path}?date=${dateString}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch water intake");
      return res.json() as Promise<{ glasses: number }>;
    },
  });
}

export function useUpdateWaterIntake() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: WaterInput) => {
      const res = await fetch(api.water.update.path, {
        method: api.water.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update water intake");
      return res.json();
    },
    onSuccess: (_, variables) => {
      const dateString = variables.date ? format(new Date(variables.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
      queryClient.invalidateQueries({ queryKey: [api.water.get.path, dateString] });
    },
  });
}
