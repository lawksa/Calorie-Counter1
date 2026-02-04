import { AppLayout } from "@/components/layout/AppLayout";
import { useWeeklyStats } from "@/hooks/use-stats";
import { useWeightLogs, useCreateWeightLog } from "@/hooks/use-weight";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Flame, 
  Beef, 
  Wheat, 
  Droplets, 
  TrendingUp,
  TrendingDown,
  Scale,
  Plus,
  Activity,
  Calendar
} from "lucide-react";
import { motion } from "framer-motion";
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { ar } from "date-fns/locale";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BodyMeasurementsCard } from "@/components/stats/BodyMeasurementsCard";
import { LifeScoreCard } from "@/components/stats/LifeScoreCard";
import { ProgressCard } from "@/components/stats/ProgressCard";
import { BMICard } from "@/components/stats/BMICard";
import { AchievementsCard } from "@/components/stats/AchievementsCard";
import { useGoals, useUpdateGoals } from "@/hooks/use-goals";

const dayLabels: Record<string, string> = {
  "0": "الأحد",
  "1": "الإثنين",
  "2": "الثلاثاء",
  "3": "الأربعاء",
  "4": "الخميس",
  "5": "الجمعة",
  "6": "السبت",
};

function calculateStreak(stats: any, goals: any): number {
  if (!stats || !goals) return 0;
  
  const caloriesGoal = goals.calories || 2000;
  const waterGoal = 30;
  
  let streak = 0;
  
  for (let i = stats.calories.length - 1; i >= 0; i--) {
    const calories = stats.calories[i]?.value || 0;
    const water = stats.water[i]?.value || 0;
    
    const caloriesOk = calories > 0 && calories <= caloriesGoal * 1.1;
    const waterOk = water >= waterGoal * 0.8;
    
    if (caloriesOk && waterOk) {
      streak++;
    } else if (calories > 0 || water > 0) {
      break;
    }
  }
  
  return streak;
}

function calculateTotalPerfectDays(stats: any, goals: any): number {
  if (!stats || !goals) return 0;
  
  const caloriesGoal = goals.calories || 2000;
  const waterGoal = 30;
  
  let total = 0;
  
  for (let i = 0; i < stats.calories.length; i++) {
    const calories = stats.calories[i]?.value || 0;
    const water = stats.water[i]?.value || 0;
    
    const caloriesOk = calories > 0 && calories <= caloriesGoal * 1.1;
    const waterOk = water >= waterGoal * 0.8;
    
    if (caloriesOk && waterOk) {
      total++;
    }
  }
  
  return total;
}

interface DaySummary {
  calories: number;
  calorieGoal: number;
  water: number;
  waterGoal: number;
  mealsCount: number;
  adherence: number;
}

function WeeklyAdherenceCard() {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 6 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 6 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: weeklySummary } = useQuery<Record<string, DaySummary>>({
    queryKey: ['/api/weekly-summary', format(weekStart, 'yyyy-MM-dd')],
    staleTime: 30000,
  });

  const getAdherenceGradient = (adherence: number) => {
    if (adherence >= 80) return "from-green-500 to-green-600";
    if (adherence >= 50) return "from-yellow-500 to-yellow-600";
    if (adherence > 0) return "from-orange-500 to-orange-600";
    return "from-muted to-muted";
  };

  const avgAdherence = weeklySummary 
    ? Math.round(Object.values(weeklySummary).reduce((sum, d) => sum + d.adherence, 0) / 7)
    : 0;

  return (
    <Card className="p-4 border-0 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-bold">الالتزام الأسبوعي</h3>
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">المتوسط: </span>
          <span className={cn(
            "font-bold",
            avgAdherence >= 80 ? "text-green-600" : avgAdherence >= 50 ? "text-yellow-600" : "text-orange-600"
          )}>
            {avgAdherence}%
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        {weekDays.map((day, index) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const daySummary = weeklySummary?.[dateKey];
          const adherence = daySummary?.adherence || 0;
          const isDayToday = isSameDay(day, today);
          const hasData = daySummary && daySummary.mealsCount > 0;

          return (
            <motion.div
              key={dateKey}
              className="flex-1 flex flex-col items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <span className="text-xs text-muted-foreground mb-1">
                {format(day, "EEE", { locale: ar })}
              </span>
              <div className={cn(
                "w-full aspect-square rounded-xl relative overflow-hidden border",
                isDayToday ? "border-primary border-2" : "border-border"
              )}>
                {hasData && (
                  <motion.div 
                    className={cn(
                      "absolute bottom-0 left-0 right-0 bg-gradient-to-t",
                      getAdherenceGradient(adherence)
                    )}
                    initial={{ height: 0 }}
                    animate={{ height: `${adherence}%` }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={cn(
                    "text-xs font-bold",
                    hasData && adherence >= 50 ? "text-white" : "text-muted-foreground"
                  )}>
                    {hasData ? `${adherence}%` : "-"}
                  </span>
                </div>
              </div>
              <span className={cn(
                "text-xs mt-1",
                isDayToday ? "font-bold text-primary" : "text-muted-foreground"
              )}>
                {format(day, "d")}
              </span>
            </motion.div>
          );
        })}
      </div>

      <div className="flex justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-green-500 to-green-600" />
          <span className="text-muted-foreground">ممتاز (80%+)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-yellow-500 to-yellow-600" />
          <span className="text-muted-foreground">جيد (50%+)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-orange-500 to-orange-600" />
          <span className="text-muted-foreground">ضعيف</span>
        </div>
      </div>
    </Card>
  );
}

export default function Stats() {
  const { data: stats, isLoading: statsLoading } = useWeeklyStats();
  const { data: weightLogs, isLoading: weightLoading } = useWeightLogs();
  const { data: goals } = useGoals();
  const updateGoals = useUpdateGoals();
  const createWeight = useCreateWeightLog();
  const [newWeight, setNewWeight] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleUpdateProfile = async (data: { height?: number; targetWeight?: number }) => {
    await updateGoals.mutateAsync({
      ...goals,
      calories: goals?.calories || 2000,
      protein: goals?.protein || 150,
      carbs: goals?.carbs || 200,
      fats: goals?.fats || 65,
      waterGlasses: goals?.waterGlasses || 8,
      height: data.height ?? goals?.height ?? undefined,
      targetWeight: data.targetWeight ?? goals?.targetWeight ?? undefined,
    });
  };

  const handleAddWeight = async () => {
    const weightKg = parseFloat(newWeight);
    if (isNaN(weightKg) || weightKg < 20 || weightKg > 300) {
      toast({ title: "خطأ", description: "أدخل وزن صحيح (20-300 كغ)", variant: "destructive" });
      return;
    }
    
    await createWeight.mutateAsync(Math.round(weightKg * 1000));
    setNewWeight("");
    setDialogOpen(false);
    toast({ title: "تم", description: "تم تسجيل الوزن بنجاح" });
  };

  if (statsLoading || weightLoading) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const chartData = stats?.calories.map((c, i) => ({
    day: dayLabels[new Date(c.date).getDay().toString()],
    calories: c.value,
    protein: stats.protein[i]?.value || 0,
    carbs: stats.carbs[i]?.value || 0,
    fats: stats.fats[i]?.value || 0,
    water: stats.water[i]?.value || 0,
    exercise: stats.exerciseCalories[i]?.value || 0,
  })) || [];

  const weightChartData = weightLogs?.slice(0, 14).reverse().map(log => ({
    date: format(new Date(log.date), "MM/dd"),
    weight: log.weight / 1000,
  })) || [];

  const avgCalories = (stats?.calories.reduce((s, c) => s + c.value, 0) || 0) / 7;
  const avgProtein = (stats?.protein.reduce((s, p) => s + p.value, 0) || 0) / 7;
  const totalExercise = stats?.exerciseCalories.reduce((s, e) => s + e.value, 0) || 0;

  const latestWeight = weightLogs?.[0]?.weight ? weightLogs[0].weight / 1000 : null;
  const previousWeight = weightLogs?.[1]?.weight ? weightLogs[1].weight / 1000 : null;
  const weightDiff = latestWeight && previousWeight ? latestWeight - previousWeight : null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">الإحصائيات</h1>
          <p className="text-muted-foreground">تتبع تقدمك الأسبوعي</p>
        </div>

        {/* Life Score */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <LifeScoreCard />
        </motion.div>

        {/* Weekly Adherence */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}>
          <WeeklyAdherenceCard />
        </motion.div>

        {/* BMI & Profile */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}>
          <BMICard
            height={goals?.height || null}
            currentWeight={weightLogs?.[0]?.weight || null}
            targetWeight={goals?.targetWeight || null}
            onUpdate={handleUpdateProfile}
          />
        </motion.div>

        {/* Weekly Progress */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <ProgressCard weeklyStats={stats || null} goals={goals || null} />
        </motion.div>

        {/* Achievements Tree */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <AchievementsCard 
            currentStreak={calculateStreak(stats, goals)}
            totalPerfectDays={calculateTotalPerfectDays(stats, goals)}
          />
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-4 border-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">متوسط السعرات</p>
                  <p className="text-xl font-bold">{Math.round(avgCalories)}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="p-4 border-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Beef className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">متوسط البروتين</p>
                  <p className="text-xl font-bold">{Math.round(avgProtein)}غ</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-4 border-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">سعرات محروقة</p>
                  <p className="text-xl font-bold">{totalExercise}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="p-4 border-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Scale className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">الوزن الحالي</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold">{latestWeight?.toFixed(1) || "--"} كغ</p>
                    {weightDiff !== null && (
                      <span className={`text-xs flex items-center ${weightDiff < 0 ? "text-green-600" : "text-red-500"}`}>
                        {weightDiff < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                        {Math.abs(weightDiff).toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Calories Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-5 border-0 shadow-md">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-primary" />
              السعرات الأسبوعية
            </h3>
            <div className="h-48" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="calories" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorCalories)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Macros Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="p-5 border-0 shadow-md">
            <h3 className="font-bold text-lg mb-4">العناصر الغذائية</h3>
            <div className="h-48" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="protein" name="بروتين" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="carbs" name="كربوهيدرات" stroke="hsl(25 95% 53%)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="fats" name="دهون" stroke="hsl(271 81% 56%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500" /> بروتين</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500" /> كربوهيدرات</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-purple-500" /> دهون</span>
            </div>
          </Card>
        </motion.div>

        {/* Weight Tracking */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="p-5 border-0 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Scale className="w-5 h-5 text-purple-600" />
                تتبع الوزن
              </h3>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="rounded-xl">
                    <Plus className="w-4 h-4 ml-1" />
                    إضافة
                  </Button>
                </DialogTrigger>
                <DialogContent dir="rtl">
                  <DialogHeader>
                    <DialogTitle>تسجيل الوزن</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="الوزن"
                        value={newWeight}
                        onChange={(e) => setNewWeight(e.target.value)}
                        className="h-12 text-center text-lg"
                        step="0.1"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">كغ</div>
                    </div>
                    <Button 
                      className="w-full h-12"
                      onClick={handleAddWeight}
                      disabled={createWeight.isPending}
                    >
                      {createWeight.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "حفظ"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {weightChartData.length > 0 ? (
              <div className="h-40" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightChartData}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="hsl(271 81% 56%)" 
                      strokeWidth={2} 
                      dot={{ fill: "hsl(271 81% 56%)" }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Scale className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>لم تسجل وزنك بعد</p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Body Measurements */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <BodyMeasurementsCard />
        </motion.div>
      </div>
    </AppLayout>
  );
}
