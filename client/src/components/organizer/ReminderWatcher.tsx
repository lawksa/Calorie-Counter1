import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMarkOrganizerNotified } from "@/hooks/use-organizer";
import { ToastAction } from "@/components/ui/toast";
import type { OrganizerItem } from "@shared/schema";

const CHECK_EVERY_MS = 20_000;

/**
 * Runs in the background while the app is open: when a reminder, event or task
 * reaches its due time it shows an in-app toast and (if allowed) a system notification.
 */
export function ReminderWatcher() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const markNotified = useMarkOrganizerNotified();
  const fired = useRef(new Set<number>());

  const { data: items = [] } = useQuery<OrganizerItem[]>({
    queryKey: ["/api/organizer/items"],
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // Ask once for notification permission when there is something to remind about
  useEffect(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "default") return;
    if (items.some((i) => i.dueAt && !i.completed && !i.notified)) {
      Notification.requestPermission().catch(() => {});
    }
  }, [items]);

  useEffect(() => {
    const check = () => {
      const now = Date.now();
      for (const item of items) {
        if (item.completed || item.notified || !item.dueAt || item.type === "note") continue;
        if (new Date(item.dueAt).getTime() > now || fired.current.has(item.id)) continue;

        fired.current.add(item.id);
        const title = item.type === "event" ? "⏰ حان موعدك" : "🔔 تذكير";

        toast({
          title,
          description: item.title,
          action: (
            <ToastAction altText="عرض" onClick={() => navigate("/organizer")}>
              عرض
            </ToastAction>
          ),
        });

        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          try {
            new Notification(title, { body: item.title, tag: `organizer-${item.id}` });
          } catch {
            // Some mobile browsers only allow notifications from a service worker
          }
        }

        markNotified.mutate(item.id);
      }
    };

    check();
    const timer = setInterval(check, CHECK_EVERY_MS);
    return () => clearInterval(timer);
  }, [items, toast, navigate, markNotified]);

  return null;
}
