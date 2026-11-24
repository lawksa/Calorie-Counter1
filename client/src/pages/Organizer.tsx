import { useEffect, useMemo, useRef, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  useOrganizerItems,
  useOrganizerMessages,
  useOrganizerChat,
  useClearOrganizerChat,
  useCreateOrganizerItem,
  useUpdateOrganizerItem,
  useDeleteOrganizerItem,
  type OrganizerItemInput,
} from "@/hooks/use-organizer";
import type { OrganizerItem } from "@shared/schema";
import {
  Bot, Send, Mic, MicOff, Trash2, Plus, Bell, CheckSquare, StickyNote, CalendarDays,
  Loader2, Sparkles, AlertCircle, Clock, Eraser, Pencil, Repeat, BellRing, BellOff,
} from "lucide-react";
import { usePushNotifications } from "@/hooks/use-push";
import { format, formatDistanceToNow, isToday, isTomorrow, isPast, startOfDay, endOfDay } from "date-fns";
import { ar } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ---------- Labels ----------
const TYPE_META = {
  task: { label: "مهمة", icon: CheckSquare, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30" },
  reminder: { label: "تذكير", icon: Bell, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30" },
  note: { label: "ملاحظة", icon: StickyNote, color: "text-sky-600 bg-sky-100 dark:bg-sky-900/30" },
  event: { label: "موعد", icon: CalendarDays, color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30" },
} as const;

const CATEGORY_LABELS: Record<string, string> = {
  general: "عام",
  work: "عمل",
  personal: "شخصي",
  health: "صحة",
  shopping: "مشتريات",
  study: "دراسة",
};

const REPEAT_LABELS: Record<string, string> = {
  none: "بدون تكرار",
  daily: "يومياً",
  weekly: "أسبوعياً",
  monthly: "شهرياً",
};

const PRIORITY_META: Record<string, { label: string; className: string }> = {
  high: { label: "عالية", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  medium: { label: "متوسطة", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  low: { label: "منخفضة", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
};

const SUGGESTIONS = [
  "وش عندي اليوم؟",
  "ذكّرني أشرب ماء بعد ساعة",
  "ذكّرني كل يوم الساعة 8 الصبح أشرب ماء",
  "أضف قائمة مشتريات: حليب، خبز، بيض",
  "رتّب لي يومي حسب الأولوية",
  "عندي اجتماع بكرة الساعة 10 الصبح",
];

function formatDue(date: Date) {
  const time = format(date, "h:mm a", { locale: ar });
  if (isToday(date)) return `اليوم ${time}`;
  if (isTomorrow(date)) return `غداً ${time}`;
  return format(date, "EEEE d MMM، h:mm a", { locale: ar });
}

// ---------- Item card ----------
function ItemCard({ item, onEdit }: { item: OrganizerItem; onEdit: (item: OrganizerItem) => void }) {
  const update = useUpdateOrganizerItem();
  const remove = useDeleteOrganizerItem();
  const meta = TYPE_META[item.type as keyof typeof TYPE_META] ?? TYPE_META.task;
  const due = item.dueAt ? new Date(item.dueAt) : null;
  const overdue = !!due && !item.completed && isPast(due);
  const Icon = meta.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className={cn(
        "rounded-2xl border bg-card p-3 flex items-start gap-3 shadow-sm",
        item.completed && "opacity-60",
        overdue && "border-red-300 dark:border-red-800",
      )}
      data-testid={`organizer-item-${item.id}`}
    >
      {item.type !== "note" ? (
        <Checkbox
          checked={item.completed}
          onCheckedChange={(v) => update.mutate({ id: item.id, completed: v === true })}
          className="mt-1 h-5 w-5 rounded-full"
          aria-label="إنجاز"
        />
      ) : (
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", meta.color)}>
          <Icon className="w-4 h-4" />
        </div>
      )}

      <button className="flex-1 min-w-0 text-right" onClick={() => onEdit(item)}>
        <p className={cn("font-medium leading-snug break-words", item.completed && "line-through")}>{item.title}</p>
        {item.notes && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap break-words">{item.notes}</p>}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {item.type !== "note" && (
            <span className={cn("inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full", meta.color)}>
              <Icon className="w-3 h-3" />
              {meta.label}
            </span>
          )}
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {CATEGORY_LABELS[item.category] ?? item.category}
          </span>
          {item.type !== "note" && item.priority !== "medium" && (
            <span className={cn("text-[10px] px-2 py-0.5 rounded-full", PRIORITY_META[item.priority]?.className)}>
              {PRIORITY_META[item.priority]?.label}
            </span>
          )}
          {item.recurrence && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              <Repeat className="w-3 h-3" />
              {REPEAT_LABELS[item.recurrence] ?? item.recurrence}
            </span>
          )}
          {due && (
            <span className={cn("inline-flex items-center gap-1 text-[10px]", overdue ? "text-red-600 font-semibold" : "text-muted-foreground")}>
              <Clock className="w-3 h-3" />
              {formatDue(due)}
              {overdue && ` · متأخرة ${formatDistanceToNow(due, { locale: ar })}`}
            </span>
          )}
        </div>
      </button>

      <div className="flex flex-col gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)} aria-label="تعديل">
          <Pencil className="w-4 h-4 text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => remove.mutate(item.id)}
          aria-label="حذف"
          data-testid={`delete-item-${item.id}`}
        >
          <Trash2 className="w-4 h-4 text-muted-foreground" />
        </Button>
      </div>
    </motion.div>
  );
}

// ---------- Add / edit dialog ----------
type Repeat = "none" | "daily" | "weekly" | "monthly";
type FormState = Required<Omit<OrganizerItemInput, "completed" | "dueAt" | "notes" | "recurrence">> & {
  notes: string;
  dueLocal: string;
  repeat: Repeat;
};

const emptyForm = (type: FormState["type"] = "task"): FormState => ({
  type,
  title: "",
  notes: "",
  category: "general",
  priority: "medium",
  dueLocal: "",
  repeat: "none",
});

function ItemDialog({
  open,
  onOpenChange,
  editing,
  defaultType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: OrganizerItem | null;
  defaultType: FormState["type"];
}) {
  const { toast } = useToast();
  const create = useCreateOrganizerItem();
  const update = useUpdateOrganizerItem();
  const [form, setForm] = useState<FormState>(emptyForm(defaultType));

  useEffect(() => {
    if (!open) return;
    setForm(
      editing
        ? {
            type: editing.type as FormState["type"],
            title: editing.title,
            notes: editing.notes ?? "",
            category: editing.category as FormState["category"],
            priority: editing.priority as FormState["priority"],
            dueLocal: editing.dueAt ? format(new Date(editing.dueAt), "yyyy-MM-dd'T'HH:mm") : "",
            repeat: (editing.recurrence as Repeat) ?? "none",
          }
        : emptyForm(defaultType),
    );
  }, [open, editing, defaultType]);

  const submit = async () => {
    if (!form.title.trim()) {
      toast({ title: "اكتب عنواناً أولاً", variant: "destructive" });
      return;
    }
    const payload: OrganizerItemInput = {
      type: form.type,
      title: form.title.trim(),
      notes: form.notes.trim() || null,
      category: form.category,
      priority: form.priority,
      dueAt: form.dueLocal ? new Date(form.dueLocal).toISOString() : null,
      // Repeating needs a first date/time to count from
      recurrence: form.dueLocal && form.type !== "note" && form.repeat !== "none" ? form.repeat : null,
    };
    try {
      if (editing) await update.mutateAsync({ id: editing.id, ...payload });
      else await create.mutateAsync(payload);
      onOpenChange(false);
    } catch {
      toast({ title: "تعذّر الحفظ", variant: "destructive" });
    }
  };

  const pending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">{editing ? "تعديل العنصر" : "إضافة جديد"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(TYPE_META) as FormState["type"][]).map((t) => {
              const M = TYPE_META[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border p-2 text-xs transition",
                    form.type === t ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground",
                  )}
                >
                  <M.icon className="w-4 h-4" />
                  {M.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5">
            <Label>العنوان</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="مثال: الاتصال بالطبيب"
              data-testid="input-item-title"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>التصنيف</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as FormState["category"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>الأولوية</Label>
              <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as FormState["priority"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.type !== "note" && (
            <div className="space-y-1.5">
              <Label>الموعد (اختياري)</Label>
              <Input
                type="datetime-local"
                value={form.dueLocal}
                onChange={(e) => setForm((f) => ({ ...f, dueLocal: e.target.value }))}
                dir="ltr"
              />
            </div>
          )}

          {form.type !== "note" && form.dueLocal && (
            <div className="space-y-1.5">
              <Label>التكرار</Label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(REPEAT_LABELS) as Repeat[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, repeat: k }))}
                    className={cn(
                      "rounded-xl border py-2 text-xs transition",
                      form.repeat === k ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground",
                    )}
                    data-testid={`repeat-${k}`}
                  >
                    {REPEAT_LABELS[k]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>ملاحظات</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              placeholder="تفاصيل إضافية..."
            />
          </div>

          <Button className="w-full" onClick={submit} disabled={pending} data-testid="button-save-item">
            {pending && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
            حفظ
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Chat ----------
function useSpeechInput(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);
  const SR = typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;

  const toggle = () => {
    if (!SR) return;
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new SR();
    rec.lang = "ar-SA";
    rec.interimResults = false;
    rec.onresult = (e: any) => onResult(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  return { supported: !!SR, listening, toggle };
}

function ChatPanel() {
  const { toast } = useToast();
  const { data: messages = [], isLoading } = useOrganizerMessages();
  const chat = useOrganizerChat();
  const clear = useClearOrganizerChat();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const speech = useSpeechInput((t) => setText((prev) => (prev ? `${prev} ${t}` : t)));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, chat.isPending]);

  const send = (msg?: string) => {
    const content = (msg ?? text).trim();
    if (!content || chat.isPending) return;
    setText("");
    chat.mutate(content, {
      onSuccess: ({ applied }) => {
        const parts = [
          applied.created && `أُضيف ${applied.created}`,
          applied.updated && `عُدّل ${applied.updated}`,
          applied.completed && `أُنجز ${applied.completed}`,
          applied.deleted && `حُذف ${applied.deleted}`,
        ].filter(Boolean);
        if (parts.length) toast({ title: "تم تحديث المنظّم", description: parts.join(" · ") });
      },
      onError: () => toast({ title: "تعذّر الوصول للمساعد", description: "حاول مرة أخرى", variant: "destructive" }),
    });
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-27rem)] min-h-[340px]">
      <div className="flex-1 overflow-y-auto space-y-3 pb-3 px-1">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="font-bold">أهلاً! أنا منظّم 👋</p>
              <p className="text-sm text-muted-foreground mt-1">
                اكتب لي أي شيء يدور في بالك وأنا أرتّبه لك: مهام، تذكيرات، مواعيد، أو ملاحظات.
              </p>
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={cn("flex", m.role === "user" ? "justify-start" : "justify-end")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md",
                )}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {chat.isPending && (
          <div className="flex justify-end">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            disabled={chat.isPending}
            className="shrink-0 text-xs rounded-full border px-3 py-1.5 bg-background hover:bg-muted transition"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex items-end gap-2 pt-1">
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => clear.mutate()}
            disabled={clear.isPending}
            aria-label="مسح المحادثة"
          >
            <Eraser className="w-5 h-5 text-muted-foreground" />
          </Button>
        )}
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="اكتب أو تكلّم... وأنا أرتّب لك"
          className="min-h-[44px] max-h-32 resize-none rounded-2xl"
          data-testid="input-organizer-chat"
        />
        {speech.supported && (
          <Button
            variant={speech.listening ? "destructive" : "outline"}
            size="icon"
            className="shrink-0 rounded-full h-11 w-11"
            onClick={speech.toggle}
            aria-label="إدخال صوتي"
          >
            {speech.listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
        )}
        <Button
          size="icon"
          className="shrink-0 rounded-full h-11 w-11"
          onClick={() => send()}
          disabled={!text.trim() || chat.isPending}
          aria-label="إرسال"
          data-testid="button-organizer-send"
        >
          {chat.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 -scale-x-100" />}
        </Button>
      </div>
    </div>
  );
}

// ---------- Lists ----------
type TaskFilter = "today" | "upcoming" | "all" | "done";

function TaskList({ items, onEdit }: { items: OrganizerItem[]; onEdit: (i: OrganizerItem) => void }) {
  const [filter, setFilter] = useState<TaskFilter>("today");

  const filtered = useMemo(() => {
    const now = new Date();
    const todayEnd = endOfDay(now);
    const actionable = items.filter((i) => i.type !== "note");
    switch (filter) {
      case "today":
        // Due today, overdue, or open without a date
        return actionable.filter((i) => !i.completed && (!i.dueAt || new Date(i.dueAt) <= todayEnd));
      case "upcoming":
        return actionable.filter((i) => !i.completed && i.dueAt && new Date(i.dueAt) > todayEnd);
      case "done":
        return actionable.filter((i) => i.completed);
      default:
        return actionable.filter((i) => !i.completed);
    }
  }, [items, filter]);

  const filters: { key: TaskFilter; label: string }[] = [
    { key: "today", label: "اليوم" },
    { key: "upcoming", label: "القادمة" },
    { key: "all", label: "الكل" },
    { key: "done", label: "المنجزة" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "text-xs rounded-full px-3 py-1.5 border transition",
              filter === f.key ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      <AnimatePresence initial={false}>
        {filtered.map((item) => (
          <ItemCard key={item.id} item={item} onEdit={onEdit} />
        ))}
      </AnimatePresence>
      {filtered.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-10">
          {filter === "done" ? "لم تُنجز شيئاً بعد" : "لا شيء هنا 🎉 اطلب من المساعد إضافة مهمة"}
        </p>
      )}
    </div>
  );
}

// ---------- Push notifications card ----------
function PushCard() {
  const { toast } = useToast();
  const push = usePushNotifications();
  const isIOS = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = typeof window !== "undefined" && window.matchMedia?.("(display-mode: standalone)").matches;

  if (push.state === "loading" || push.state === "server-off") return null;

  if (push.state === "unsupported") {
    if (!isIOS || standalone) return null;
    return (
      <div className="rounded-2xl border bg-card p-3 text-xs text-muted-foreground flex items-start gap-2">
        <BellRing className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
        <p>لتصلك التذكيرات على الآيفون والتطبيق مغلق: اضغط زر المشاركة ثم "إضافة إلى الشاشة الرئيسية"، وافتح التطبيق من هناك.</p>
      </div>
    );
  }

  if (push.state === "denied") {
    return (
      <div className="rounded-2xl border bg-card p-3 text-xs text-muted-foreground flex items-start gap-2">
        <BellOff className="w-4 h-4 mt-0.5 shrink-0" />
        <p>التنبيهات محظورة لهذا الموقع. فعّلها من إعدادات المتصفح ثم أعد فتح الصفحة.</p>
      </div>
    );
  }

  const on = push.state === "on";
  return (
    <div className="rounded-2xl border bg-card p-3 flex items-center gap-3">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", on ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
        {on ? <BellRing className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{on ? "التنبيهات مفعّلة على هذا الجهاز" : "تنبيهات والتطبيق مغلق"}</p>
        <p className="text-[11px] text-muted-foreground">
          {on ? "ستصلك التذكيرات حتى لو أغلقت التطبيق" : "فعّلها لتصلك التذكيرات على جوالك أو جهازك"}
        </p>
      </div>
      {on ? (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="text-xs"
            onClick={async () => {
              try {
                const r = await push.test();
                toast({ title: r.sent ? "أُرسل تنبيه تجريبي" : "لم يصل التنبيه", description: r.sent ? undefined : "جرّب إيقاف التنبيهات وتفعيلها من جديد" });
              } catch {
                toast({ title: "تعذّر الإرسال", variant: "destructive" });
              }
            }}
          >
            تجربة
          </Button>
          <Button size="sm" variant="outline" className="text-xs" onClick={() => push.disable()}>
            إيقاف
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          className="text-xs"
          onClick={() => push.enable().catch(() => toast({ title: "تعذّر تفعيل التنبيهات", variant: "destructive" }))}
          data-testid="button-enable-push"
        >
          تفعيل
        </Button>
      )}
    </div>
  );
}

// ---------- Page ----------
export default function Organizer() {
  const { data: items = [], isLoading } = useOrganizerItems();
  const [tab, setTab] = useState("chat");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<OrganizerItem | null>(null);

  const stats = useMemo(() => {
    const now = new Date();
    const open = items.filter((i) => !i.completed && i.type !== "note");
    return {
      today: open.filter((i) => i.dueAt && new Date(i.dueAt) >= startOfDay(now) && new Date(i.dueAt) <= endOfDay(now)).length,
      overdue: open.filter((i) => i.dueAt && new Date(i.dueAt) < now).length,
      open: open.length,
      notes: items.filter((i) => i.type === "note").length,
    };
  }, [items]);

  const notes = items.filter((i) => i.type === "note");

  const openEditor = (item: OrganizerItem | null) => {
    setEditing(item);
    setDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Hero */}
        <div className="rounded-3xl p-4 bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-lg">المنظّم الذكي</h2>
                <p className="text-xs text-white/80">{format(new Date(), "EEEE، d MMMM", { locale: ar })}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full bg-white/15 text-white hover:bg-white/25 border-0"
              onClick={() => openEditor(null)}
              data-testid="button-add-item"
            >
              <Plus className="w-4 h-4 ml-1" />
              إضافة
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[
              { label: "اليوم", value: stats.today },
              { label: "متأخرة", value: stats.overdue, alert: stats.overdue > 0 },
              { label: "مفتوحة", value: stats.open },
              { label: "ملاحظات", value: stats.notes },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/10 py-2 text-center">
                <p className="text-xl font-bold flex items-center justify-center gap-1">
                  {s.alert && <AlertCircle className="w-4 h-4 text-amber-300" />}
                  {s.value}
                </p>
                <p className="text-[10px] text-white/80">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <PushCard />

        <Tabs value={tab} onValueChange={setTab} dir="rtl">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="chat" className="gap-1"><Sparkles className="w-4 h-4" />المساعد</TabsTrigger>
            <TabsTrigger value="tasks" className="gap-1">
              <CheckSquare className="w-4 h-4" />المهام
              {stats.open > 0 && <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{stats.open}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-1"><StickyNote className="w-4 h-4" />الملاحظات</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-4">
            <ChatPanel />
          </TabsContent>

          <TabsContent value="tasks" className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <TaskList items={items} onEdit={openEditor} />
            )}
          </TabsContent>

          <TabsContent value="notes" className="mt-4 space-y-3">
            <AnimatePresence initial={false}>
              {notes.map((n) => (
                <ItemCard key={n.id} item={n} onEdit={openEditor} />
              ))}
            </AnimatePresence>
            {notes.length === 0 && !isLoading && (
              <p className="text-center text-sm text-muted-foreground py-10">
                لا توجد ملاحظات. قل للمساعد "احفظ ملاحظة: ..." أو أضفها يدوياً.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        defaultType={tab === "notes" ? "note" : "task"}
      />
    </AppLayout>
  );
}
