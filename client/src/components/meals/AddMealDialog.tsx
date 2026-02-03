import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Loader2, Sparkles, Plus, UtensilsCrossed, Beef, Wheat, Droplets, Flame, Sunrise, Sun, Moon, Cookie, History, Trash2, BookmarkPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCreateMeal, useEstimateCalories } from "@/hooks/use-meals";
import { insertMealSchema, type SavedFood } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Meal types with icons and colors
const mealTypes = [
  { value: "breakfast", label: "فطور", icon: Sunrise, color: "from-orange-400 to-yellow-400" },
  { value: "lunch", label: "غداء", icon: Sun, color: "from-blue-400 to-cyan-400" },
  { value: "dinner", label: "عشاء", icon: Moon, color: "from-purple-400 to-indigo-400" },
  { value: "snack", label: "سناك", icon: Cookie, color: "from-pink-400 to-rose-400" },
];

const formSchema = insertMealSchema.extend({
  calories: z.coerce.number().min(0),
  protein: z.coerce.number().min(0),
  carbs: z.coerce.number().min(0),
  fats: z.coerce.number().min(0),
  mealType: z.string().default("lunch"),
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

  const [selectedMealType, setSelectedMealType] = useState("lunch");

  // Saved foods queries
  const { data: savedFoods = [] } = useQuery<SavedFood[]>({
    queryKey: ['/api/saved-foods']
  });

  const saveFoodMutation = useMutation({
    mutationFn: async (food: { name: string; calories: number; protein: number; carbs: number; fats: number }) => {
      return apiRequest('POST', '/api/saved-foods', { ...food, source: 'manual' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saved-foods'] });
    }
  });

  const deleteSavedFoodMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/saved-foods/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/saved-foods'] });
      toast({ title: "تم حذف الوجبة المحفوظة" });
    }
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      mealType: "lunch",
    },
  });

  const handleEstimate = async () => {
    if (!query.trim()) return;
    try {
      const result = await estimateCalories.mutateAsync(query);
      const resultWithMealType = { ...result, mealType: selectedMealType };
      setEstimatedData(resultWithMealType);
      form.reset(resultWithMealType);
    } catch (error) {
      toast({
        title: "فشل التحليل",
        description: "لم نتمكن من تحليل الوجبة. حاول مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: FormValues, saveFood: boolean = true) => {
    try {
      const mealDate = new Date(date);
      const now = new Date();
      mealDate.setHours(now.getHours(), now.getMinutes());

      await createMeal.mutateAsync({
        ...data,
        mealType: selectedMealType,
        date: mealDate.toISOString(),
      });
      
      // Save the food for future use if not already saved
      if (saveFood && data.name && !savedFoods.some(f => f.name === data.name)) {
        saveFoodMutation.mutate({
          name: data.name,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fats: data.fats
        });
      }
      
      const mealTypeLabel = mealTypes.find(t => t.value === selectedMealType)?.label || "";
      toast({
        title: "تمت الإضافة",
        description: `تم تسجيل ${data.name} في ${mealTypeLabel} بنجاح.`,
      });
      setOpen(false);
      form.reset();
      setQuery("");
      setEstimatedData(null);
      setSelectedMealType("lunch");
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إضافة الوجبة. حاول مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const addFromSavedFood = async (food: SavedFood) => {
    try {
      const mealDate = new Date(date);
      const now = new Date();
      mealDate.setHours(now.getHours(), now.getMinutes());

      await createMeal.mutateAsync({
        name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fats: food.fats,
        mealType: selectedMealType,
        date: mealDate.toISOString(),
      });
      
      const mealTypeLabel = mealTypes.find(t => t.value === selectedMealType)?.label || "";
      toast({
        title: "تمت الإضافة",
        description: `تم تسجيل ${food.name} في ${mealTypeLabel} بنجاح.`,
      });
      setOpen(false);
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

        {/* Meal Type Selector */}
        <div className="px-6 pb-4">
          <Label className="font-medium mb-2 block">نوع الوجبة</Label>
          <div className="grid grid-cols-4 gap-2">
            {mealTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedMealType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSelectedMealType(type.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                    isSelected 
                      ? `bg-gradient-to-br ${type.color} text-white shadow-lg scale-105` 
                      : "bg-muted hover:bg-muted/80"
                  }`}
                  data-testid={`button-meal-type-${type.value}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Tabs defaultValue={savedFoods.length > 0 ? "saved" : "ai"} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mb-4 p-1 bg-muted rounded-xl">
            <TabsTrigger value="saved" className="flex-1 gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <History className="w-4 h-4" /> السابقة
              {savedFoods.length > 0 && (
                <span className="text-xs bg-primary/20 text-primary px-1.5 rounded-full">{savedFoods.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex-1 gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Sparkles className="w-4 h-4" /> ذكي
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex-1 gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <UtensilsCrossed className="w-4 h-4" /> يدوي
            </TabsTrigger>
          </TabsList>

          <TabsContent value="saved" className="flex-1 overflow-y-auto px-6 pb-6">
            {savedFoods.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <History className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-bold text-lg mb-2">لا توجد وجبات محفوظة</h3>
                <p className="text-sm text-muted-foreground max-w-[250px]">
                  عند إضافة وجبة جديدة، سيتم حفظها تلقائياً هنا لإضافتها بسرعة في المستقبل
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {savedFoods.map((food) => (
                  <motion.div
                    key={food.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border rounded-xl p-3 hover-elevate"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{food.name}</h4>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3 text-primary" />
                            {food.calories}
                          </span>
                          <span className="flex items-center gap-1">
                            <Beef className="w-3 h-3" style={{ color: "hsl(142 71% 45%)" }} />
                            {food.protein}غ
                          </span>
                          <span className="flex items-center gap-1">
                            <Wheat className="w-3 h-3" style={{ color: "hsl(25 95% 53%)" }} />
                            {food.carbs}غ
                          </span>
                          <span className="flex items-center gap-1">
                            <Droplets className="w-3 h-3" style={{ color: "hsl(271 81% 56%)" }} />
                            {food.fats}غ
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteSavedFoodMutation.mutate(food.id)}
                          disabled={deleteSavedFoodMutation.isPending}
                          data-testid={`button-delete-saved-${food.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 px-3 gap-1 bg-gradient-to-r from-primary to-emerald-500"
                          onClick={() => addFromSavedFood(food)}
                          disabled={createMeal.isPending}
                          data-testid={`button-add-saved-${food.id}`}
                        >
                          <Plus className="w-4 h-4" />
                          إضافة
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

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
                      onClick={() => onSubmit(estimatedData!, true)}
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
            <form onSubmit={form.handleSubmit((data) => onSubmit(data, true))} className="space-y-5">
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
