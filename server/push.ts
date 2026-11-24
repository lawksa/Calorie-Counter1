import type { Express, RequestHandler } from "express";
import webpush from "web-push";
import { z } from "zod";
import { storage } from "./storage";
import { markNotified } from "./recurrence";
import { db } from "./db";
import { appSettings } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Web Push: sends reminders to the user's phone/computer even when the app is closed.
 * Uses VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY if set; otherwise generates a key pair once
 * and keeps it in the database, so it works with no setup.
 */
let publicKey: string | null = null;
let pushEnabled = false;

async function loadVapidKeys(): Promise<{ publicKey: string; privateKey: string }> {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
  }
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, "vapid_keys"));
  if (row) return JSON.parse(row.value);
  const keys = webpush.generateVAPIDKeys();
  await db.insert(appSettings).values({ key: "vapid_keys", value: JSON.stringify(keys) }).onConflictDoNothing();
  // Re-read in case another instance won the race
  const [saved] = await db.select().from(appSettings).where(eq(appSettings.key, "vapid_keys"));
  return saved ? JSON.parse(saved.value) : keys;
}

const subscriptionInput = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

const CHECK_EVERY_MS = 30_000;
let running = false;

async function sendDueReminders() {
  if (running) return;
  running = true;
  try {
    const due = await storage.getDueOrganizerItems(new Date());
    for (const item of due) {
      const subs = await storage.getPushSubscriptions(item.userId);
      const payload = JSON.stringify({
        title: item.type === "event" ? "⏰ حان موعدك" : "🔔 تذكير",
        body: item.title,
        tag: `organizer-${item.id}`,
        url: "/organizer",
      });
      await Promise.all(
        subs.map((s) =>
          webpush
            .sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 3600 })
            .catch(async (err: any) => {
              // The browser unsubscribed or the subscription expired
              if (err?.statusCode === 404 || err?.statusCode === 410) await storage.deletePushSubscription(s.endpoint);
              else console.error("Push send failed:", err?.statusCode ?? err);
            }),
        ),
      );
      // Only consume the reminder once a device actually got it; otherwise the open app still shows it
      if (subs.length) await markNotified(item);
    }
  } catch (err) {
    console.error("Reminder scheduler error:", err);
  } finally {
    running = false;
  }
}

export async function registerPushRoutes(app: Express, requireAuth: RequestHandler) {
  try {
    const keys = await loadVapidKeys();
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:owner@example.com", keys.publicKey, keys.privateKey);
    publicKey = keys.publicKey;
    pushEnabled = true;
  } catch (err) {
    console.error("Push notifications disabled (could not load keys):", err);
  }

  const userIdOf = (req: any): string => req.user.claims.sub;

  app.get("/api/push/config", requireAuth, (_req, res) => {
    res.json({ enabled: pushEnabled, publicKey: pushEnabled ? publicKey : null });
  });

  app.post("/api/push/subscribe", requireAuth, async (req, res) => {
    if (!pushEnabled) return res.status(503).json({ message: "التنبيهات غير مفعّلة على الخادم" });
    const parsed = subscriptionInput.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "اشتراك غير صالح" });
    const { endpoint, keys } = parsed.data;
    await storage.savePushSubscription(userIdOf(req), { endpoint, p256dh: keys.p256dh, auth: keys.auth });
    res.status(201).json({ ok: true });
  });

  app.post("/api/push/unsubscribe", requireAuth, async (req, res) => {
    const endpoint = typeof req.body?.endpoint === "string" ? req.body.endpoint : "";
    if (endpoint) await storage.deletePushSubscription(endpoint);
    res.status(204).send();
  });

  app.post("/api/push/test", requireAuth, async (req, res) => {
    if (!pushEnabled) return res.status(503).json({ message: "التنبيهات غير مفعّلة على الخادم" });
    const subs = await storage.getPushSubscriptions(userIdOf(req));
    const payload = JSON.stringify({ title: "✅ التنبيهات تعمل", body: "ستصلك التذكيرات حتى لو كان التطبيق مغلقاً", url: "/organizer" });
    const results = await Promise.allSettled(
      subs.map((s) => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)),
    );
    res.json({ sent: results.filter((r) => r.status === "fulfilled").length, devices: subs.length });
  });

  if (pushEnabled) {
    setInterval(sendDueReminders, CHECK_EVERY_MS).unref();
    console.log("Push reminders enabled");
  }
}
