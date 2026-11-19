import { AppLayout } from "@/components/layout/AppLayout";
import { useGoals, useUpdateGoals } from "@/hooks/use-goals";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertGoalSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Save, Target, User, Flame, Beef, Wheat, Droplets, GlassWater, Calculator, ChevronDown, ChevronUp, Sparkles, Check, Watch, ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Activity levels with multipliers
const activityLevels = [
  { value: "sedentary", label: "قليل الحركة", multiplier: 1.2 },
  { value: "light", label: "تمرين خفيف (1-3 أيام)", multiplier: 1.375 },
  { value: "moderate", label: "متوسط (3-5 أيام)", multiplier: 1.55 },
  { value: "active", label: "عالي (6 أيام)", multiplier: 1.725 },
  { value: "athlete", label: "رياضي محترف", multiplier: 1.9 },
];

// Goals
const fitnessGoals = [
  { value: "cut", label: "تنشيف", color: "text-orange-500" },
  { value: "maintain", label: "ثبات", color: "text-blue-500" },
  { value: "bulk", label: "تضخيم", color: "text-green-500" },
];

// Calculator function - exactly as specified
function calculateMacros(
  gender: "male" | "female",
  weightKg: number,
  heightCm: number,
  age: number,
  activityLevel: string,
  goal: string
): { calories: number; protein: number; carbs: number; fats: number } {
  // Step 2: Calculate BMR (Mifflin-St Jeor)
  let bmr: number;
  if (gender === "male") {
    bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
  } else {
    bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
  }
  bmr = Math.round(bmr);

  // Step 3: Calculate TDEE
  const activity = activityLevels.find(a => a.value === activityLevel);
  const tdee = bmr * (activity?.multiplier || 1.2);

  // Step 4: Adjust calories based on goal
  let calorieAdjustment = 0;
  if (goal === "cut" || goal === "bulk") {
    if (weightKg < 70) {
      calorieAdjustment = 300;
    } else if (weightKg <= 90) {
      calorieAdjustment = 400;
    } else {
      calorieAdjustment = 500;
    }
  }

  let targetCalories: number;
  if (goal === "cut") {
    targetCalories = tdee - calorieAdjustment;
  } else if (goal === "bulk") {
    targetCalories = tdee + calorieAdjustment;
  } else {
    targetCalories = tdee;
  }

  // Step 5: Calculate macros
  // Protein
  let protein: number;
  if (goal === "cut") {
    protein = weightKg * 2.2;
  } else {
    protein = weightKg * 1.8;
  }

  // Fats
  let fats = weightKg * 0.9;

  // Reserved calories
  const proteinCalories = protein * 4;
  const fatCalories = fats * 9;

  // Carbs
  let carbCalories = targetCalories - (proteinCalories + fatCalories);
  
  // If carbs are negative, reduce fats
  if (carbCalories < 0) {
    // Reduce fats to make carbs at least 0
    const excessCalories = Math.abs(carbCalories);
    const fatReduction = excessCalories / 9;
    fats = Math.max(0, fats - fatReduction);
    carbCalories = 0;
  }

  const carbs = carbCalories / 4;

  // Round all values
  return {
    calories: Math.round(targetCalories),
    protein: Math.round(protein),
    carbs: Math.max(0, Math.round(carbs)),
    fats: Math.round(fats),
  };
}

const formSchema = insertGoalSchema.extend({
  calories: z.coerce.number().min(100),
  protein: z.coerce.number().min(0),
  carbs: z.coerce.number().min(0),
  fats: z.coerce.number().min(0),
});

type FormValues = z.infer<typeof formSchema>;

export default function Settings() {
  const { data: goals, isLoading } = useGoals();
  const { user } = useAuth();
  const updateGoals = useUpdateGoals();
  const { toast } = useToast();

  // Calculator state
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcGender, setCalcGender] = useState<"male" | "female">("male");
  const [calcWeight, setCalcWeight] = useState("");
  const [calcHeight, setCalcHeight] = useState("");
  const [calcAge, setCalcAge] = useState("");
  const [calcActivity, setCalcActivity] = useState("moderate");
  const [calcGoal, setCalcGoal] = useState("maintain");
  const [calculatedResults, setCalculatedResults] = useState<{
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      calories: 2000,
      protein: 150,
      carbs: 200,
      fats: 65,
      waterGlasses: 8,
    },
  });

  useEffect(() => {
    if (goals) {
      form.reset(goals);
    }
  }, [goals, form]);

  // Auto-calculate calories when macros change
  const watchedProtein = form.watch("protein");
  const watchedCarbs = form.watch("carbs");
  const watchedFats = form.watch("fats");

  useEffect(() => {
    const protein = Number(watchedProtein) || 0;
    const carbs = Number(watchedCarbs) || 0;
    const fats = Number(watchedFats) || 0;
    
    // Calculate calories: protein*4 + carbs*4 + fats*9
    const calculatedCalories = Math.round((protein * 4) + (carbs * 4) + (fats * 9));
    
    if (calculatedCalories > 0) {
      form.setValue("calories", calculatedCalories);
    }
  }, [watchedProtein, watchedCarbs, watchedFats, form]);

  const handleCalculate = () => {
    const weight = parseFloat(calcWeight);
    const height = parseFloat(calcHeight);
    const age = parseInt(calcAge);

    if (!weight || weight <= 0 || !height || height <= 0 || !age || age <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال جميع القيم بشكل صحيح",
        variant: "destructive",
      });
      return;
    }

    const results = calculateMacros(calcGender, weight, height, age, calcActivity, calcGoal);
    setCalculatedResults(results);
  };

  const applyCalculatedValues = async () => {
    if (calculatedResults) {
      const currentValues = form.getValues();
      const newGoals = {
        ...currentValues,
        calories: calculatedResults.calories,
        protein: calculatedResults.protein,
        carbs: calculatedResults.carbs,
        fats: calculatedResults.fats,
      };
      
      try {
        await updateGoals.mutateAsync(newGoals);
        form.reset(newGoals);
        toast({
          title: "تم الحفظ",
          description: "تم تطبيق وحفظ القيم المحسوبة بنجاح",
        });
      } catch (error) {
        toast({
          title: "خطأ",
          description: "فشل في حفظ الأهداف الجديدة",
          variant: "destructive",
        });
      }
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      await updateGoals.mutateAsync(data);
      toast({
        title: "تم الحفظ",
        description: "تم تحديث أهدافك الغذائية بنجاح.",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث الأهداف.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">الإعدادات</h1>

        {/* User Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="p-5 border-0 shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center overflow-hidden">
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{user?.firstName || "مستخدم"} {user?.lastName || ""}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Macro Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border-0 shadow-md overflow-hidden">
            <button
              onClick={() => setShowCalculator(!showCalculator)}
              className="w-full p-5 flex items-center justify-between hover:bg-muted/50 transition-colors"
              data-testid="button-toggle-calculator"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <div className="text-right">
                  <h3 className="font-bold text-lg">حاسبة السعرات والماكروز</h3>
                  <p className="text-sm text-muted-foreground">احسب احتياجك اليومي بدقة</p>
                </div>
              </div>
              {showCalculator ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            <AnimatePresence>
              {showCalculator && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-5 pt-0 space-y-4 border-t">
                    {/* Gender Selection */}
                    <div className="space-y-2">
                      <Label className="font-medium">الجنس</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant={calcGender === "male" ? "default" : "outline"}
                          className="h-12 rounded-xl"
                          onClick={() => setCalcGender("male")}
                          data-testid="button-gender-male"
                        >
                          ذكر
                        </Button>
                        <Button
                          type="button"
                          variant={calcGender === "female" ? "default" : "outline"}
                          className="h-12 rounded-xl"
                          onClick={() => setCalcGender("female")}
                          data-testid="button-gender-female"
                        >
                          أنثى
                        </Button>
                      </div>
                    </div>

                    {/* Weight, Height, Age */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm">الوزن (كجم)</Label>
                        <Input
                          type="number"
                          placeholder="70"
                          value={calcWeight}
                          onChange={(e) => setCalcWeight(e.target.value)}
                          className="h-11 text-center rounded-xl"
                          data-testid="input-calc-weight"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">الطول (سم)</Label>
                        <Input
                          type="number"
                          placeholder="170"
                          value={calcHeight}
                          onChange={(e) => setCalcHeight(e.target.value)}
                          className="h-11 text-center rounded-xl"
                          data-testid="input-calc-height"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">العمر</Label>
                        <Input
                          type="number"
                          placeholder="25"
                          value={calcAge}
                          onChange={(e) => setCalcAge(e.target.value)}
                          className="h-11 text-center rounded-xl"
                          data-testid="input-calc-age"
                        />
                      </div>
                    </div>

                    {/* Activity Level */}
                    <div className="space-y-2">
                      <Label className="font-medium">مستوى النشاط</Label>
                      <Select value={calcActivity} onValueChange={setCalcActivity}>
                        <SelectTrigger className="h-12 rounded-xl" data-testid="select-activity">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {activityLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Goal */}
                    <div className="space-y-2">
                      <Label className="font-medium">الهدف</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {fitnessGoals.map((goal) => (
                          <Button
                            key={goal.value}
                            type="button"
                            variant={calcGoal === goal.value ? "default" : "outline"}
                            className={`h-12 rounded-xl ${calcGoal === goal.value ? "" : goal.color}`}
                            onClick={() => setCalcGoal(goal.value)}
                            data-testid={`button-goal-${goal.value}`}
                          >
                            {goal.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Calculate Button */}
                    <Button
                      type="button"
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                      onClick={handleCalculate}
                      data-testid="button-calculate"
                    >
                      <Sparkles className="w-4 h-4 ml-2" />
                      احسب الآن
                    </Button>

                    {/* Results */}
                    <AnimatePresence>
                      {calculatedResults && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-4"
                        >
                          <div className="bg-gradient-to-br from-primary/10 to-emerald-500/10 p-4 rounded-2xl">
                            <div className="text-center mb-4">
                              <p className="text-sm text-muted-foreground">السعرات اليومية المطلوبة</p>
                              <p className="text-4xl font-bold text-primary">{calculatedResults.calories}</p>
                              <p className="text-sm text-muted-foreground">سعرة حرارية</p>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3">
                              <div className="bg-background/80 p-3 rounded-xl text-center">
                                <Beef className="w-5 h-5 mx-auto mb-1" style={{ color: "hsl(142 71% 45%)" }} />
                                <p className="text-lg font-bold">{calculatedResults.protein}</p>
                                <p className="text-xs text-muted-foreground">بروتين (غ)</p>
                              </div>
                              <div className="bg-background/80 p-3 rounded-xl text-center">
                                <Wheat className="w-5 h-5 mx-auto mb-1" style={{ color: "hsl(25 95% 53%)" }} />
                                <p className="text-lg font-bold">{calculatedResults.carbs}</p>
                                <p className="text-xs text-muted-foreground">كربوهيدرات (غ)</p>
                              </div>
                              <div className="bg-background/80 p-3 rounded-xl text-center">
                                <Droplets className="w-5 h-5 mx-auto mb-1" style={{ color: "hsl(271 81% 56%)" }} />
                                <p className="text-lg font-bold">{calculatedResults.fats}</p>
                                <p className="text-xs text-muted-foreground">دهون (غ)</p>
                              </div>
                            </div>

                            <div className="mt-3 text-center">
                              <p className="text-xs text-muted-foreground">
                                الهدف: <span className="font-bold">{fitnessGoals.find(g => g.value === calcGoal)?.label}</span>
                              </p>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-12 rounded-xl border-primary text-primary hover:bg-primary/10"
                            onClick={applyCalculatedValues}
                            data-testid="button-apply-values"
                          >
                            <Check className="w-4 h-4 ml-2" />
                            تطبيق هذه القيم على أهدافي
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Goals Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="p-5 border-0 shadow-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">الأهداف اليومية</h3>
                <p className="text-sm text-muted-foreground">حدد أهدافك من السعرات والعناصر الغذائية</p>
              </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Calories - Auto Calculated */}
              <div className="space-y-2">
                <Label htmlFor="calories" className="flex items-center gap-2 font-bold">
                  <Flame className="w-4 h-4 text-primary" />
                  السعرات الحرارية اليومية
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-normal mr-auto">
                    تحسب تلقائياً
                  </span>
                </Label>
                <div className="relative">
                  <Input 
                    id="calories" 
                    type="number" 
                    {...form.register("calories")} 
                    readOnly
                    className="h-14 text-2xl font-bold text-center rounded-xl border-primary/30 bg-primary/5 cursor-default"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    سعرة
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  = (بروتين × 4) + (كربوهيدرات × 4) + (دهون × 9)
                </p>
              </div>

              {/* Macros Grid */}
              <div className="grid grid-cols-3 gap-3 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="protein" className="flex items-center gap-1 text-sm font-medium" style={{ color: "hsl(142 71% 45%)" }}>
                    <Beef className="w-4 h-4" />
                    بروتين
                  </Label>
                  <Input 
                    id="protein" 
                    type="number" 
                    {...form.register("protein")}
                    className="h-12 text-center rounded-xl font-bold"
                    style={{ borderColor: "hsl(142 71% 45% / 0.3)" }}
                  />
                  <p className="text-xs text-center text-muted-foreground">غرام</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carbs" className="flex items-center gap-1 text-sm font-medium" style={{ color: "hsl(25 95% 53%)" }}>
                    <Wheat className="w-4 h-4" />
                    كربوهيدرات
                  </Label>
                  <Input 
                    id="carbs" 
                    type="number" 
                    {...form.register("carbs")} 
                    className="h-12 text-center rounded-xl font-bold"
                    style={{ borderColor: "hsl(25 95% 53% / 0.3)" }}
                  />
                  <p className="text-xs text-center text-muted-foreground">غرام</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fats" className="flex items-center gap-1 text-sm font-medium" style={{ color: "hsl(271 81% 56%)" }}>
                    <Droplets className="w-4 h-4" />
                    دهون
                  </Label>
                  <Input 
                    id="fats" 
                    type="number" 
                    {...form.register("fats")} 
                    className="h-12 text-center rounded-xl font-bold"
                    style={{ borderColor: "hsl(271 81% 56% / 0.3)" }}
                  />
                  <p className="text-xs text-center text-muted-foreground">غرام</p>
                </div>
              </div>

              {/* Water Goal */}
              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="waterGlasses" className="flex items-center gap-2 font-bold text-blue-500">
                  <GlassWater className="w-4 h-4" />
                  هدف الماء اليومي
                </Label>
                <div className="relative">
                  <Input 
                    id="waterGlasses" 
                    type="number" 
                    {...form.register("waterGlasses")} 
                    className="h-12 text-center rounded-xl font-bold border-blue-200 focus-visible:ring-blue-500"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    أكواب
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-emerald-500 rounded-2xl shadow-lg mt-6"
                disabled={updateGoals.isPending}
              >
                {updateGoals.isPending ? (
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                ) : (
                  <Save className="w-5 h-5 ml-2" />
                )}
                حفظ التغييرات
              </Button>
            </form>
          </Card>
        </motion.div>

        {/* Health Connect Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Link href="/health-connect">
            <Card className="p-5 border-0 shadow-md hover-elevate cursor-pointer" data-testid="link-health-connect">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                    <Watch className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold">ربط الساعات الذكية</h3>
                    <p className="text-sm text-muted-foreground">Apple Health و Health Connect</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full">قريباً</span>
                  <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </Card>
          </Link>
        </motion.div>
      </div>
    </AppLayout>
  );
}
