import type { Express, RequestHandler } from "express";
import type OpenAI from "openai";
import { z } from "zod";
import { storage } from "./storage";
import type { OrganizerItem } from "@shared/schema";
import { recurrences, completeItem, markNotified } from "./recurrence";

const itemTypes = ["task", "reminder", "note", "event"] as const;
const categories = ["general", "work", "personal", "health", "shopping", "study"] as const;
const priorities = ["low", "medium", "high"] as const;

const itemInput = z.object({
  type: z.enum(itemTypes).default("task"),
  title: z.string().trim().min(1, "العنوان مطلوب").max(200),
  notes: z.string().max(2000).nullish(),
  category: z.enum(categories).default("general"),
  priority: z.enum(priorities).default("medium"),
  dueAt: z
    .string()
    .transform((s) => (/[zZ]|[+-]\d{2}:?\d{2}$/.test(s) ? s : `${s}+03:00`)) // no offset → Riyadh time
    .refine((s) => !isNaN(Date.parse(s)), "تاريخ غير صالح")
    .nullish(),
  recurrence: z.enum(recurrences).nullish(),
  completed: z.boolean().optional(),
});

const itemUpdate = itemInput.partial();

// Shape the AI is asked to return. Unknown/invalid actions are dropped instead of failing the whole reply.
const aiAction = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), item: itemInput }),
  z.object({ action: z.literal("update"), id: z.number().int(), changes: itemUpdate }),
  z.object({ action: z.literal("complete"), id: z.number().int() }),
  z.object({ action: z.literal("delete"), id: z.number().int() }),
]);

const TIMEZONE = "Asia/Riyadh";

function toDbFields(input: z.infer<typeof itemUpdate>) {
  const { dueAt, ...rest } = input;
  return {
    ...rest,
    ...(dueAt !== undefined ? { dueAt: dueAt ? new Date(dueAt) : null } : {}),
  };
}

function describeItem(item: OrganizerItem) {
  const due = item.dueAt
    ? new Date(item.dueAt).toLocaleString("en-GB", { timeZone: TIMEZONE, hour12: false })
    : "بدون موعد";
  const repeat = item.recurrence ? ` (يتكرر: ${item.recurrence})` : "";
  return `#${item.id} [${item.type}/${item.category}/${item.priority}] ${item.title} — ${due}${repeat}${item.completed ? " (منجزة)" : ""}`;
}

function nowInRiyadh() {
  const now = new Date();
  const local = now.toLocaleString("en-GB", { timeZone: TIMEZONE, hour12: false });
  const weekday = now.toLocaleDateString("ar-SA", { timeZone: TIMEZONE, weekday: "long" });
  return { iso: now.toISOString(), local, weekday };
}

function buildSystemPrompt(items: OrganizerItem[]) {
  const { iso, local, weekday } = nowInRiyadh();
  const open = items.filter((i) => !i.completed).slice(0, 60);
  const done = items.filter((i) => i.completed).slice(0, 10);

  return `أنت "منظّم"، مساعد شخصي ذكي يتحدث العربية بأسلوب ودود ومختصر. مهمتك تنظيم حياة المستخدم: المهام والتذكيرات والملاحظات والمواعيد.

الوقت الحالي: ${local} بتوقيت الرياض (UTC+03:00)، اليوم ${weekday}. (UTC: ${iso})

عناصر المستخدم المفتوحة:
${open.length ? open.map(describeItem).join("\n") : "لا يوجد"}

آخر العناصر المنجزة:
${done.length ? done.map(describeItem).join("\n") : "لا يوجد"}

القواعد:
- عندما يطلب المستخدم إضافة شيء، أنشئ عنصراً مناسباً. يمكنك تقسيم رسالة واحدة إلى عدة عناصر.
- type: "task" للمهام، "reminder" لما يحتاج تنبيهاً في وقت محدد، "note" للأفكار والمعلومات، "event" للمواعيد والاجتماعات.
- category: general | work | personal | health | shopping | study
- priority: low | medium | high
- dueAt: تاريخ ووقت بصيغة ISO 8601 مع المنطقة الزمنية +03:00 (مثال: 2026-01-15T09:00:00+03:00). احسب التواريخ النسبية ("بكرة"، "بعد ساعتين"، "الخميس الجاي") من الوقت الحالي. إذا ذُكر يوم بدون وقت للتذكير استخدم 09:00. اترك dueAt = null للملاحظات أو إذا لم يُذكر وقت.
- recurrence: "daily" | "weekly" | "monthly" أو null. استخدمه عندما يقول المستخدم "كل يوم"، "يومياً"، "كل أسبوع"، "كل خميس"، "كل شهر"... ويجب أن يكون معه dueAt لأول مرة (مثال: "كل خميس 8 الصبح" ← dueAt أقرب خميس 08:00 و recurrence "weekly"). التذكير المتكرر يتجدد تلقائياً بعد تنبيهه، والمهمة المتكررة تتجدد عند إنجازها.
- لتعديل أو إنهاء أو حذف عنصر استخدم رقمه (#id) من القائمة أعلاه فقط.
- إذا سأل المستخدم "وش عندي اليوم" أو طلب ملخصاً أو خطة، رتّب الإجابة من القائمة أعلاه حسب الوقت والأولوية دون إنشاء عناصر.
- لا تخترع أرقام عناصر غير موجودة. إذا كان الطلب غامضاً اسأل سؤالاً قصيراً.
- رد الرسالة (reply) يكون قصيراً وواضحاً ويؤكد ما تم فعله، ويمكن استخدام الإيموجي باعتدال.

أرجع JSON فقط بهذا الشكل:
{
  "reply": "نص الرد للمستخدم",
  "actions": [
    {"action": "create", "item": {"type": "task", "title": "...", "notes": null, "category": "general", "priority": "medium", "dueAt": null, "recurrence": null}},
    {"action": "update", "id": 12, "changes": {"dueAt": "..."}},
    {"action": "complete", "id": 12},
    {"action": "delete", "id": 12}
  ]
}`;
}

export function registerOrganizerRoutes(app: Express, requireAuth: RequestHandler, openai: OpenAI) {
  const userIdOf = (req: any): string => req.user.claims.sub;

  app.get("/api/organizer/items", requireAuth, async (req, res) => {
    res.json(await storage.getOrganizerItems(userIdOf(req)));
  });

  app.post("/api/organizer/items", requireAuth, async (req, res) => {
    const parsed = itemInput.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const fields = toDbFields(parsed.data);
    const item = await storage.createOrganizerItem(userIdOf(req), fields as any);
    res.status(201).json(item);
  });

  app.patch("/api/organizer/items/:id", requireAuth, async (req, res) => {
    const parsed = itemUpdate.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const existing = await storage.getOrganizerItem(parseInt(String(req.params.id)), userIdOf(req));
    if (!existing) return res.status(404).json({ message: "العنصر غير موجود" });

    const { completed, ...rest } = parsed.data;
    const updates: any = toDbFields(rest);
    // Re-arm the reminder when its time changes or it is reopened
    if (rest.dueAt !== undefined || completed === false) updates.notified = false;
    if (completed === false) updates.completed = false;

    let item = Object.keys(updates).length
      ? await storage.updateOrganizerItem(existing.id, existing.userId, updates)
      : existing;
    if (completed === true && !existing.completed && item) item = await completeItem(item);
    res.json(item);
  });

  app.post("/api/organizer/items/:id/notified", requireAuth, async (req, res) => {
    const existing = await storage.getOrganizerItem(parseInt(String(req.params.id)), userIdOf(req));
    if (!existing) return res.status(404).json({ message: "العنصر غير موجود" });
    res.json(await markNotified(existing));
  });

  app.delete("/api/organizer/items/:id", requireAuth, async (req, res) => {
    await storage.deleteOrganizerItem(parseInt(String(req.params.id)), userIdOf(req));
    res.status(204).send();
  });

  app.get("/api/organizer/messages", requireAuth, async (req, res) => {
    res.json(await storage.getOrganizerMessages(userIdOf(req)));
  });

  app.delete("/api/organizer/messages", requireAuth, async (req, res) => {
    await storage.clearOrganizerMessages(userIdOf(req));
    res.status(204).send();
  });

  app.post("/api/organizer/chat", requireAuth, async (req, res) => {
    const userId = userIdOf(req);
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    if (!message) return res.status(400).json({ message: "اكتب رسالتك أولاً" });
    if (message.length > 2000) return res.status(400).json({ message: "الرسالة طويلة جداً" });

    try {
      const [items, history] = await Promise.all([
        storage.getOrganizerItems(userId),
        storage.getOrganizerMessages(userId, 12),
      ]);

      await storage.createOrganizerMessage(userId, "user", message);

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: buildSystemPrompt(items) },
          ...history.map((m) => ({
            role: (m.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
            content: m.content,
          })),
          { role: "user", content: message },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1200,
      });

      let reply = "تم ✅";
      let rawActions: unknown[] = [];
      try {
        const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
        if (typeof parsed.reply === "string" && parsed.reply.trim()) reply = parsed.reply.trim();
        if (Array.isArray(parsed.actions)) rawActions = parsed.actions;
      } catch {
        reply = "عذراً، لم أفهم ذلك جيداً. حاول صياغة طلبك بشكل آخر.";
      }

      const owned = new Map(items.map((i) => [i.id, i]));
      const applied = { created: 0, updated: 0, completed: 0, deleted: 0 };

      for (const raw of rawActions.slice(0, 20)) {
        const result = aiAction.safeParse(raw);
        if (!result.success) continue;
        const action = result.data;

        if (action.action === "create") {
          const fields = toDbFields(action.item);
          await storage.createOrganizerItem(userId, fields as any);
          applied.created++;
          continue;
        }

        const target = owned.get(action.id);
        if (!target) continue;

        if (action.action === "update") {
          const { completed, ...changes } = action.changes;
          const updates: any = toDbFields(changes);
          if (changes.dueAt !== undefined) updates.notified = false;
          if (Object.keys(updates).length) await storage.updateOrganizerItem(action.id, userId, updates);
          if (completed === true && !target.completed) await completeItem({ ...target, ...updates });
          applied.updated++;
        } else if (action.action === "complete") {
          if (!target.completed) await completeItem(target);
          applied.completed++;
        } else if (action.action === "delete") {
          await storage.deleteOrganizerItem(action.id, userId);
          applied.deleted++;
        }
      }

      const assistantMessage = await storage.createOrganizerMessage(userId, "assistant", reply);
      res.json({ reply: assistantMessage, applied });
    } catch (err) {
      console.error("Organizer chat error:", err);
      res.status(500).json({ message: "تعذّر الوصول للمساعد حالياً، حاول مرة أخرى" });
    }
  });
}
