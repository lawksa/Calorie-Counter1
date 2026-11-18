import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { OrganizerItem, OrganizerMessage } from "@shared/schema";

export type OrganizerItemInput = {
  type?: "task" | "reminder" | "note" | "event";
  title?: string;
  notes?: string | null;
  category?: "general" | "work" | "personal" | "health" | "shopping" | "study";
  priority?: "low" | "medium" | "high";
  dueAt?: string | null;
  completed?: boolean;
};

const ITEMS_KEY = ["/api/organizer/items"];
const MESSAGES_KEY = ["/api/organizer/messages"];

export function useOrganizerItems() {
  return useQuery<OrganizerItem[]>({ queryKey: ITEMS_KEY, staleTime: 30_000 });
}

export function useOrganizerMessages() {
  return useQuery<OrganizerMessage[]>({ queryKey: MESSAGES_KEY });
}

export function useCreateOrganizerItem() {
  return useMutation({
    mutationFn: async (data: OrganizerItemInput) => {
      const res = await apiRequest("POST", "/api/organizer/items", data);
      return (await res.json()) as OrganizerItem;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ITEMS_KEY }),
  });
}

export function useUpdateOrganizerItem() {
  return useMutation({
    mutationFn: async ({ id, ...data }: OrganizerItemInput & { id: number }) => {
      const res = await apiRequest("PATCH", `/api/organizer/items/${id}`, data);
      return (await res.json()) as OrganizerItem;
    },
    onMutate: async ({ id, ...data }) => {
      // Optimistic update so checking a task feels instant
      await queryClient.cancelQueries({ queryKey: ITEMS_KEY });
      const prev = queryClient.getQueryData<OrganizerItem[]>(ITEMS_KEY);
      if (prev && data.completed !== undefined) {
        queryClient.setQueryData<OrganizerItem[]>(
          ITEMS_KEY,
          prev.map((i) => (i.id === id ? { ...i, completed: data.completed! } : i)),
        );
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(ITEMS_KEY, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ITEMS_KEY }),
  });
}

export function useDeleteOrganizerItem() {
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/organizer/items/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ITEMS_KEY }),
  });
}

export function useMarkOrganizerNotified() {
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/organizer/items/${id}/notified`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ITEMS_KEY }),
  });
}

export function useOrganizerChat() {
  return useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/organizer/chat", { message });
      return (await res.json()) as {
        reply: OrganizerMessage;
        applied: { created: number; updated: number; completed: number; deleted: number };
      };
    },
    onMutate: async (message: string) => {
      // Show the user's message immediately
      await queryClient.cancelQueries({ queryKey: MESSAGES_KEY });
      const prev = queryClient.getQueryData<OrganizerMessage[]>(MESSAGES_KEY) ?? [];
      const optimistic = {
        id: -Date.now(),
        userId: "",
        role: "user",
        content: message,
        createdAt: new Date(),
      } as OrganizerMessage;
      queryClient.setQueryData<OrganizerMessage[]>(MESSAGES_KEY, [...prev, optimistic]);
      return { prev };
    },
    onError: (_err, _msg, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(MESSAGES_KEY, ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: MESSAGES_KEY });
      queryClient.invalidateQueries({ queryKey: ITEMS_KEY });
    },
  });
}

export function useClearOrganizerChat() {
  return useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/organizer/messages");
    },
    onSuccess: () => queryClient.setQueryData(MESSAGES_KEY, []),
  });
}
