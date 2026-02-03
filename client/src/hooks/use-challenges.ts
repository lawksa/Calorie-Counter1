import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Challenge, UserChallenge } from "@shared/schema";

export function useChallenges() {
  return useQuery<Challenge[]>({
    queryKey: ["/api/challenges"],
  });
}

export function useUserChallenges() {
  return useQuery<(UserChallenge & { challenge: Challenge })[]>({
    queryKey: ["/api/challenges/progress"],
  });
}

export function useUpdateChallengeProgress() {
  return useMutation({
    mutationFn: async (data: { challengeId: number; currentValue: number; completed: boolean }) => {
      const res = await apiRequest("POST", "/api/challenges/progress", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges/progress"] });
    },
  });
}
