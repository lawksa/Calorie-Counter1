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
  Activity
} from "lucide-react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import { useState } from "react";
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
import { useGoals } from "@/hooks/use-goals";

const dayLabels: Record<string, string> = {
  "0": "الأحد",
  "1": "الإثنين",
  "2": "الثلاثاء",
  "3": "الأربعاء",
  "4": "الخميس",
  "5": "الجمعة",
  "6": "السبت",
};

export default function Stats() {
  const { data: stats, isLoading: statsLoading } = useWeeklyStats();
  const { data: weightLogs, isLoading: weightLoading } = useWeightLogs();
  const { data: goals } = useGoals();
  const createWeight = useCreateWeightLog();
  const [newWeight, setNewWeight] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

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

        {/* Weekly Progress */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <ProgressCard weeklyStats={stats || null} goals={goals || null} />
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
