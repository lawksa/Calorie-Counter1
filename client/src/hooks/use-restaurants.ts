import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { Restaurant, MenuItem } from "@shared/schema";

export function useRestaurants() {
  return useQuery({
    queryKey: [api.restaurants.list.path],
    queryFn: async () => {
      const res = await fetch(api.restaurants.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch restaurants");
      return res.json() as Promise<Restaurant[]>;
    },
  });
}

export function useRestaurantMenu(restaurantId: number | null) {
  return useQuery({
    queryKey: [api.restaurants.getMenu.path, restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const url = buildUrl(api.restaurants.getMenu.path, { id: restaurantId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch menu");
      return res.json() as Promise<MenuItem[]>;
    },
    enabled: !!restaurantId,
  });
}
