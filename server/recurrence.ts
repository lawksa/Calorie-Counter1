import { addDays, addMonths } from "date-fns";
import { storage } from "./storage";
import type { OrganizerItem } from "@shared/schema";

export const recurrences = ["daily", "weekly", "monthly"] as const;
export type Recurrence = (typeof recurrences)[number];

/** Next occurrence strictly after `after`, stepping from `from`. (Riyadh has no DST, so plain date math keeps the local time.) */
export function nextOccurrence(from: Date, recurrence: string, after = new Date()): Date | null {
  const step = (d: Date) =>
    recurrence === "daily" ? addDays(d, 1) :
    recurrence === "weekly" ? addDays(d, 7) :
    recurrence === "monthly" ? addMonths(d, 1) : null;

  let next = step(from);
  if (!next) return null;
  for (let i = 0; next <= after && i < 1000; i++) next = step(next)!;
  return next;
}

/**
 * Mark an item done. A recurring task is kept as done (history) and a fresh copy
 * is created for its next occurrence.
 */
export async function completeItem(item: OrganizerItem): Promise<OrganizerItem | undefined> {
  const done = await storage.updateOrganizerItem(item.id, item.userId, { completed: true });
  if (item.recurrence && item.dueAt) {
    const next = nextOccurrence(new Date(item.dueAt), item.recurrence);
    if (next) {
      await storage.createOrganizerItem(item.userId, {
        type: item.type,
        title: item.title,
        notes: item.notes,
        category: item.category,
        priority: item.priority,
        recurrence: item.recurrence,
        dueAt: next,
        completed: false,
      });
    }
  }
  return done;
}

/**
 * Record that a due item has been announced. Recurring reminders and events roll
 * forward to their next time (nobody "completes" a reminder); everything else is
 * just flagged. Safe to call twice: it does nothing unless the item is still due.
 */
export async function markNotified(item: OrganizerItem): Promise<OrganizerItem | undefined> {
  if (item.notified || item.completed || !item.dueAt || new Date(item.dueAt) > new Date()) return item;

  if (item.recurrence && (item.type === "reminder" || item.type === "event")) {
    const next = nextOccurrence(new Date(item.dueAt), item.recurrence);
    if (next) return storage.updateOrganizerItem(item.id, item.userId, { dueAt: next, notified: false });
  }
  return storage.updateOrganizerItem(item.id, item.userId, { notified: true });
}
