import { useQuery } from "@tanstack/react-query";

interface DailyStat {
  date: string;
  value: number;
}

interface WeeklyStats {
  calories: DailyStat[];
  protein: DailyStat[];
  carbs: DailyStat[];
  fats: DailyStat[];
  water: DailyStat[];
  exerciseCalories: DailyStat[];
}

export function useWeeklyStats() {
  return useQuery<WeeklyStats>({
    queryKey: ["/api/stats/weekly"],
  });
}
