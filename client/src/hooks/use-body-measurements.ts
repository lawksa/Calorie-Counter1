import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { BodyMeasurement, InsertBodyMeasurement } from "@shared/schema";

export function useBodyMeasurements() {
  return useQuery<BodyMeasurement[]>({
    queryKey: ["/api/body-measurements"],
  });
}

export function useCreateBodyMeasurement() {
  return useMutation({
    mutationFn: async (data: InsertBodyMeasurement) => {
      const res = await apiRequest("POST", "/api/body-measurements", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/body-measurements"] });
    },
  });
}

export function useDeleteBodyMeasurement() {
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/body-measurements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/body-measurements"] });
    },
  });
}
