import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Loader2, Sparkles, Plus, UtensilsCrossed, Beef, Wheat, Droplets, Flame } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCreateMeal, useEstimateCalories } from "@/hooks/use-meals";
import { insertMealSchema } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

const formSchema = insertMealSchema.extend({
  calories: z.coerce.number().min(0),
  protein: z.coerce.number().min(0),
  carbs: z.coerce.number().min(0),
  fats: z.coerce.number().min(0),
});

type FormValues = z.infer<typeof formSchema>;

interface AddMealDialogProps {
  date: Date;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

export function AddMealDialog({ date, externalOpen, onExternalOpenChange }: AddMealDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onExternalOpenChange || setInternalOpen;
  const { toast } = useToast();
  const createMeal = useCreateMeal();
  const estimateCalories = useEstimateCalories();
  
  const [query, setQuery] = useState("");
  const [estimatedData, setEstimatedData] = useState<FormValues | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
    },
  });

  const handleEstimate = async () => {
    if (!query.trim()) return;
    try {
      const result = await estimateCalories.mutateAsync(query);
      setEstimatedData(result);
      form.reset(result);
    } catch (error) {
      toast({
        title: "فشل التحليل",
        description: "لم نتمكن من تحليل الوجبة. حاول مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const mealDate = new Date(date);
      const now = new Date();
      mealDate.setHours(now.getHours(), now.getMinutes());

      await createMeal.mutateAsync({
        ...data,
        date: mealDate.toISOString(),
      });
      
      toast({
        title: "تمت الإضافة",
        description: `تم تسجيل ${data.name} بنجاح.`,
      });
      setOpen(false);
      form.reset();
      setQuery("");
      setEstimatedData(null);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إضافة الوجبة. حاول مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const isExternallyControlled = externalOpen !== undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isExternallyControlled && (
        <DialogTrigger asChild>
          <Button className="rounded-2xl shadow-lg hover:shadow-xl transition-all gap-2 px-5 bg-gradient-to-r from-primary to-emerald-500">
            <Plus className="w-5 h-5" /> إضافة وجبة
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-hidden flex flex-col p-0" dir="rtl">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-bold">تسجيل وجبة</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {format(date, "d MMMM yyyy", { locale: ar })}
          </p>
        </DialogHeader>

        <Tabs defaultValue="ai" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mb-4 p-1 bg-muted rounded-xl">
            <TabsTrigger value="ai" className="flex-1 gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Sparkles className="w-4 h-4" /> تحليل ذكي
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex-1 gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <UtensilsCrossed className="w-4 h-4" /> إدخال يدوي
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="flex-1 flex flex-col gap-4 overflow-y-auto px-6 pb-6">
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 p-5 rounded-2xl border border-purple-100 dark:border-purple-900/50">
                <Label htmlFor="query" className="text-purple-900 dark:text-purple-100 font-bold mb-3 block">
                  ماذا أكلت؟
                </Label>
                <Textarea
                  id="query"
                  placeholder="مثال: صدر دجاج مشوي مع أرز وسلطة خضراء"
                  className="resize-none bg-white dark:bg-background border-purple-200 dark:border-purple-800 focus-visible:ring-purple-500 min-h-[100px] text-base rounded-xl"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <Button 
                  onClick={handleEstimate} 
                  disabled={estimateCalories.isPending || !query.trim()}
                  className="w-full mt-4 h-12 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white gap-2 rounded-xl"
                >
                  {estimateCalories.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  تحليل الوجبة
                </Button>
              </div>

              <AnimatePresence>
                {estimatedData && (
                  <motion.div 
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="bg-card p-5 rounded-2xl border shadow-sm">
                      <h4 className="font-bold text-lg mb-4">{estimatedData.name}</h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <NutrientCard 
                          icon={Flame} 
                          label="سعرات" 
                          value={estimatedData.calories} 
                          color="hsl(158 64% 52%)" 
                        />
                        <NutrientCard 
                          icon={Beef} 
                          label="بروتين" 
                          value={estimatedData.protein} 
                          unit="غ"
                          color="hsl(142 71% 45%)" 
                        />
                        <NutrientCard 
                          icon={Wheat} 
                          label="كربوهيدرات" 
                          value={estimatedData.carbs} 
                          unit="غ"
                          color="hsl(25 95% 53%)" 
                        />
                        <NutrientCard 
                          icon={Droplets} 
                          label="دهون" 
                          value={estimatedData.fats} 
                          unit="غ"
                          color="hsl(271 81% 56%)" 
                        />
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-emerald-500 rounded-2xl shadow-lg"
                      onClick={() => onSubmit(estimatedData)}
                      disabled={createMeal.isPending}
                    >
                      {createMeal.isPending && <Loader2 className="w-5 h-5 ml-2 animate-spin" />}
                      إضافة الوجبة
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="flex-1 overflow-y-auto px-6 pb-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-medium">اسم الوجبة</Label>
                <div className="flex gap-2">
                  <Input 
                    id="name" 
                    {...form.register("name")} 
                    placeholder="مثال: شوفان مع فواكه" 
                    className="h-12 rounded-xl flex-1"
                    data-testid="input-meal-name"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 px-4 rounded-xl gap-2 shrink-0"
                    onClick={async () => {
                      const name = form.getValues("name");
                      if (!name.trim()) {
                        toast({ title: "أدخل اسم الوجبة أولاً", variant: "destructive" });
                        return;
                      }
                      try {
                        const result = await estimateCalories.mutateAsync(name);
                        form.setValue("calories", result.calories);
                        form.setValue("protein", result.protein);
                        form.setValue("carbs", result.carbs);
                        form.setValue("fats", result.fats);
                        toast({ title: "تم تحديث القيم الغذائية" });
                      } catch {
                        toast({ title: "فشل التقدير", variant: "destructive" });
                      }
                    }}
                    disabled={estimateCalories.isPending}
                    data-testid="button-estimate-manual"
                  >
                    {estimateCalories.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    تقدير
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  اكتب اسم الوجبة واضغط "تقدير" للحصول على القيم الغذائية التقريبية
                </p>
              </div>

              <AnimatePresence>
                {(form.watch("calories") > 0 || form.watch("protein") > 0) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-muted/50 p-4 rounded-xl space-y-3"
                  >
                    <p className="text-sm font-medium text-muted-foreground">القيم الغذائية (قابلة للتعديل)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="calories" className="text-xs font-medium text-primary flex items-center gap-1">
                          <Flame className="w-3 h-3" /> السعرات
                        </Label>
                        <Input 
                          id="calories" 
                          type="number" 
                          {...form.register("calories")} 
                          className="h-10 rounded-lg border-primary/30 focus-visible:ring-primary"
                          data-testid="input-meal-calories"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="protein" className="text-xs font-medium flex items-center gap-1" style={{ color: "hsl(142 71% 45%)" }}>
                          <Beef className="w-3 h-3" /> البروتين (غ)
                        </Label>
                        <Input 
                          id="protein" 
                          type="number" 
                          {...form.register("protein")}
                          className="h-10 rounded-lg"
                          style={{ borderColor: "hsl(142 71% 45% / 0.3)" }}
                          data-testid="input-meal-protein"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="carbs" className="text-xs font-medium flex items-center gap-1" style={{ color: "hsl(25 95% 53%)" }}>
                          <Wheat className="w-3 h-3" /> الكربوهيدرات (غ)
                        </Label>
                        <Input 
                          id="carbs" 
                          type="number" 
                          {...form.register("carbs")} 
                          className="h-10 rounded-lg"
                          style={{ borderColor: "hsl(25 95% 53% / 0.3)" }}
                          data-testid="input-meal-carbs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="fats" className="text-xs font-medium flex items-center gap-1" style={{ color: "hsl(271 81% 56%)" }}>
                          <Droplets className="w-3 h-3" /> الدهون (غ)
                        </Label>
                        <Input 
                          id="fats" 
                          type="number" 
                          {...form.register("fats")} 
                          className="h-10 rounded-lg"
                          style={{ borderColor: "hsl(271 81% 56% / 0.3)" }}
                          data-testid="input-meal-fats"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {(!form.watch("calories") && !form.watch("protein")) && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="calories-init" className="font-medium text-primary">السعرات</Label>
                    <Input 
                      id="calories-init" 
                      type="number" 
                      {...form.register("calories")} 
                      className="h-12 rounded-xl border-primary/30 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="protein-init" className="font-medium" style={{ color: "hsl(142 71% 45%)" }}>البروتين (غ)</Label>
                    <Input 
                      id="protein-init" 
                      type="number" 
                      {...form.register("protein")}
                      className="h-12 rounded-xl"
                      style={{ borderColor: "hsl(142 71% 45% / 0.3)" }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carbs-init" className="font-medium" style={{ color: "hsl(25 95% 53%)" }}>الكربوهيدرات (غ)</Label>
                    <Input 
                      id="carbs-init" 
                      type="number" 
                      {...form.register("carbs")} 
                      className="h-12 rounded-xl"
                      style={{ borderColor: "hsl(25 95% 53% / 0.3)" }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fats-init" className="font-medium" style={{ color: "hsl(271 81% 56%)" }}>الدهون (غ)</Label>
                    <Input 
                      id="fats-init" 
                      type="number" 
                      {...form.register("fats")} 
                      className="h-12 rounded-xl"
                      style={{ borderColor: "hsl(271 81% 56% / 0.3)" }}
                    />
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-emerald-500 rounded-2xl shadow-lg mt-4"
                disabled={createMeal.isPending}
                data-testid="button-add-meal-manual"
              >
                {createMeal.isPending ? "جاري الإضافة..." : "إضافة الوجبة"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function NutrientCard({ icon: Icon, label, value, unit, color }: { 
  icon: any, 
  label: string, 
  value: number, 
  unit?: string,
  color: string 
}) {
  return (
    <div className="bg-muted/50 p-3 rounded-xl flex items-center gap-3">
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-bold" style={{ color }}>
          {value}{unit && <span className="text-sm font-normal text-muted-foreground mr-1">{unit}</span>}
        </p>
      </div>
    </div>
  );
}
