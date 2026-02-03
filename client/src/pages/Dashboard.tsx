import { useState, useRef } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useMeals, useDeleteMeal, useCreateMeal } from "@/hooks/use-meals";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGoals } from "@/hooks/use-goals";
import { useWaterIntake, useUpdateWaterIntake } from "@/hooks/use-water";
import { AppLayout } from "@/components/layout/AppLayout";
import { CalorieRing } from "@/components/dashboard/CalorieRing";
import { MacroCard } from "@/components/dashboard/MacroCard";
import { WaterTracker } from "@/components/dashboard/WaterTracker";
import { DateSelector } from "@/components/common/DateSelector";
import { AddMealDialog } from "@/components/meals/AddMealDialog";
import { DailyChallenges } from "@/components/dashboard/DailyChallenges";
import { HabitsTracker } from "@/components/dashboard/HabitsTracker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Trash2, 
  Loader2, 
  Sun, 
  CloudSun, 
  Moon, 
  Cookie,
  Plus,
  Beef,
  Wheat,
  Droplets,
  ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Meal } from "@shared/schema";

type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const mealCategories: { key: MealCategory; label: string; labelAr: string; icon: any; gradient: string }[] = [
  { key: 'breakfast', label: 'Breakfast', labelAr: 'الفطور', icon: Sun, gradient: 'from-amber-400 to-orange-500' },
  { key: 'lunch', label: 'Lunch', labelAr: 'الغداء', icon: CloudSun, gradient: 'from-orange-500 to-red-500' },
  { key: 'dinner', label: 'Dinner', labelAr: 'العشاء', icon: Moon, gradient: 'from-purple-500 to-violet-600' },
  { key: 'snack', label: 'Snack', labelAr: 'وجبات خفيفة', icon: Cookie, gradient: 'from-cyan-400 to-blue-500' },
];

function categorizeMeal(date: Date): MealCategory {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 16 && hour < 21) return 'dinner';
  return 'snack';
}

export default function Dashboard() {
  const [date, setDate] = useState<Date>(new Date());
  const [expandedCategory, setExpandedCategory] = useState<MealCategory | null>(null);
  const [addMealOpen, setAddMealOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { data: meals, isLoading: mealsLoading } = useMeals(date);
  const { data: goals, isLoading: goalsLoading } = useGoals();
  const { data: waterData, isLoading: waterLoading } = useWaterIntake(date);
  const updateWater = useUpdateWaterIntake();
  const deleteMeal = useDeleteMeal();
  const createMeal = useCreateMeal();

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await apiRequest("POST", "/api/analyze-meal-image", { 
        image: base64 
      });
      const result = await response.json();
      
      if (result.success && result.meal) {
        setAnalysisResult(result.meal);
        setShowResultDialog(true);
      } else {
        toast({
          title: "تعذر التحليل",
          description: result.error || "لم نتمكن من تحليل الصورة، حاول مجدداً",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحليل الصورة",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAddAnalyzedMeal = async () => {
    if (!analysisResult) return;

    try {
      await createMeal.mutateAsync({
        name: analysisResult.name,
        calories: analysisResult.calories,
        protein: analysisResult.protein,
        carbs: analysisResult.carbs,
        fats: analysisResult.fats,
      });
      toast({
        title: "تمت الإضافة",
        description: `تم إضافة ${analysisResult.name} إلى وجباتك`,
      });
      setShowResultDialog(false);
      setAnalysisResult(null);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إضافة الوجبة",
        variant: "destructive",
      });
    }
  };

  if (mealsLoading || goalsLoading || waterLoading) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const totals = meals?.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fats: acc.fats + meal.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  ) || { calories: 0, protein: 0, carbs: 0, fats: 0 };

  const target = goals || {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fats: 65,
    waterGlasses: 8,
  };

  const waterGlasses = waterData?.glasses || 0;

  const handleWaterUpdate = (glasses: number) => {
    updateWater.mutate({
      glasses,
      date: format(date, "yyyy-MM-dd"),
    });
  };

  // Group meals by category
  const mealsByCategory = meals?.reduce((acc, meal) => {
    const category = categorizeMeal(new Date(meal.date));
    if (!acc[category]) acc[category] = [];
    acc[category].push(meal);
    return acc;
  }, {} as Record<MealCategory, Meal[]>) || {};

  const getCategoryCalories = (category: MealCategory) => {
    return mealsByCategory[category]?.reduce((sum, m) => sum + m.calories, 0) || 0;
  };

  return (
    <AppLayout onManualAdd={() => setAddMealOpen(true)} onCameraAdd={handleCameraClick}>
      <div className="flex flex-col gap-6">
        {/* Date Selector */}
        <DateSelector date={date} onDateChange={setDate} />

        {/* Calorie Ring Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-card to-muted/30">
            <div className="flex flex-col items-center">
              <CalorieRing consumed={totals.calories} target={target.calories} />
              
              {/* Quick stats */}
              <div className="flex items-center gap-6 mt-6 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{totals.calories}</p>
                  <p className="text-muted-foreground">مستهلك</p>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{target.calories}</p>
                  <p className="text-muted-foreground">الهدف</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Macros Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="p-5 border-0 shadow-md">
            <h3 className="font-bold text-lg mb-4">العناصر الغذائية</h3>
            <div className="space-y-4">
              <MacroCard 
                label="البروتين" 
                consumed={totals.protein} 
                target={target.protein} 
                color="hsl(142 71% 45%)"
                icon={Beef}
              />
              <MacroCard 
                label="الكربوهيدرات" 
                consumed={totals.carbs} 
                target={target.carbs} 
                color="hsl(25 95% 53%)"
                icon={Wheat}
              />
              <MacroCard 
                label="الدهون" 
                consumed={totals.fats} 
                target={target.fats} 
                color="hsl(271 81% 56%)"
                icon={Droplets}
              />
            </div>
          </Card>
        </motion.div>

        {/* Water Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Card className="p-5 border-0 shadow-md">
            <WaterTracker 
              glasses={waterGlasses} 
              target={target.waterGlasses || 8} 
              onUpdate={handleWaterUpdate}
              isPending={updateWater.isPending}
            />
          </Card>
        </motion.div>

        {/* Meals by Category */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">وجبات اليوم</h3>
            <AddMealDialog date={date} />
          </div>

          {mealCategories.map((category, index) => {
            const categoryMeals = mealsByCategory[category.key] || [];
            const categoryCalories = getCategoryCalories(category.key);
            const isExpanded = expandedCategory === category.key;
            const Icon = category.icon;

            return (
              <motion.div
                key={category.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
              >
                <Card 
                  className={cn(
                    "overflow-hidden border-0 shadow-sm transition-all duration-300",
                    isExpanded && "shadow-md"
                  )}
                >
                  {/* Category Header */}
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : category.key)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors"
                    data-testid={`meal-category-${category.key}`}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br text-white shadow-lg",
                      category.gradient
                    )}>
                      <Icon className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1 text-right">
                      <h4 className="font-bold">{category.labelAr}</h4>
                      <p className="text-sm text-muted-foreground">
                        {categoryMeals.length} {categoryMeals.length === 1 ? 'وجبة' : 'وجبات'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{categoryCalories}</span>
                      <span className="text-sm text-muted-foreground">سعرة</span>
                      <ChevronLeft className={cn(
                        "w-5 h-5 text-muted-foreground transition-transform duration-300",
                        isExpanded && "rotate-90"
                      )} />
                    </div>
                  </button>

                  {/* Expanded Meals */}
                  <AnimatePresence>
                    {isExpanded && categoryMeals.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t"
                      >
                        <div className="p-3 space-y-2">
                          {categoryMeals.map((meal) => (
                            <div 
                              key={meal.id}
                              className="flex items-center justify-between p-3 bg-muted/30 rounded-xl group"
                            >
                              <div>
                                <p className="font-medium">{meal.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(meal.date), "h:mm a", { locale: ar })}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <div className="text-left">
                                  <p className="font-bold text-primary">{meal.calories} سعرة</p>
                                  <p className="text-xs text-muted-foreground">
                                    ب{meal.protein} • ك{meal.carbs} • د{meal.fats}
                                  </p>
                                </div>
                                
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => deleteMeal.mutate(meal.id)}
                                  data-testid={`delete-meal-${meal.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Daily Challenges Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <DailyChallenges />
        </motion.div>

        {/* Daily Habits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <HabitsTracker />
        </motion.div>

        {/* Empty State */}
        {(!meals || meals.length === 0) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-1">لا توجد وجبات</h3>
            <p className="text-muted-foreground text-sm mb-4">
              ابدأ بتسجيل وجباتك لمتابعة سعراتك الحرارية
            </p>
            <AddMealDialog date={date} />
          </motion.div>
        )}
      </div>

      {/* Hidden Add Meal Dialog for external trigger */}
      <AddMealDialog 
        date={date} 
        externalOpen={addMealOpen} 
        onExternalOpenChange={setAddMealOpen} 
      />

      {/* Camera Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleImageSelect}
        data-testid="input-camera-capture"
      />

      {/* Analysis Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-[400px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>نتيجة التحليل</DialogTitle>
          </DialogHeader>
          
          {analysisResult && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-bold">{analysisResult.name}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary/10 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{analysisResult.calories}</p>
                  <p className="text-xs text-muted-foreground">سعرة حرارية</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{analysisResult.protein}g</p>
                  <p className="text-xs text-muted-foreground">بروتين</p>
                </div>
                <div className="bg-orange-100 dark:bg-orange-900/30 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-orange-600">{analysisResult.carbs}g</p>
                  <p className="text-xs text-muted-foreground">كربوهيدرات</p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/30 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-purple-600">{analysisResult.fats}g</p>
                  <p className="text-xs text-muted-foreground">دهون</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowResultDialog(false)}
                  data-testid="button-cancel-analysis"
                >
                  إلغاء
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-primary to-emerald-500"
                  onClick={handleAddAnalyzedMeal}
                  disabled={createMeal.isPending}
                  data-testid="button-confirm-analysis"
                >
                  {createMeal.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "إضافة الوجبة"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

