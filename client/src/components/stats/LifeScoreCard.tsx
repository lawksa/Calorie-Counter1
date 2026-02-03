import { useWeeklyStats } from "@/hooks/use-stats";
import { useGoals } from "@/hooks/use-goals";
import { Card } from "@/components/ui/card";
import { Loader2, Heart, TrendingUp, Droplets, Flame, Dumbbell } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function LifeScoreCard() {
  const { data: stats, isLoading: statsLoading } = useWeeklyStats();
  const { data: goals, isLoading: goalsLoading } = useGoals();

  if (statsLoading || goalsLoading) {
    return (
      <Card className="p-4 border-0 shadow-sm">
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  const calorieGoal = goals?.calories || 2000;
  const waterGoal = goals?.waterGlasses || 8;

  const avgCalories = stats?.calories.reduce((s, c) => s + c.value, 0) || 0;
  const avgWater = stats?.water.reduce((s, w) => s + w.value, 0) || 0;
  const totalExercise = stats?.exerciseCalories.reduce((s, e) => s + e.value, 0) || 0;

  const daysWithMeals = stats?.calories.filter(c => c.value > 0).length || 0;
  const daysWithWater = stats?.water.filter(w => w.value > 0).length || 0;
  const daysWithExercise = stats?.exerciseCalories.filter(e => e.value > 0).length || 0;

  const calorieScore = Math.min(100, (daysWithMeals / 7) * 100);
  const waterScore = Math.min(100, (avgWater / (waterGoal * 7)) * 100);
  const exerciseScore = Math.min(100, (daysWithExercise / 5) * 100);

  const totalScore = Math.round((calorieScore * 0.4 + waterScore * 0.35 + exerciseScore * 0.25));

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "ممتاز";
    if (score >= 60) return "جيد";
    if (score >= 40) return "متوسط";
    return "يحتاج تحسين";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-500";
    if (score >= 60) return "from-yellow-500 to-amber-500";
    if (score >= 40) return "from-orange-500 to-red-400";
    return "from-red-500 to-rose-500";
  };

  const metrics = [
    { 
      label: "التغذية", 
      score: Math.round(calorieScore), 
      icon: Flame,
      description: `${daysWithMeals}/7 أيام تتبع`
    },
    { 
      label: "الترطيب", 
      score: Math.round(waterScore), 
      icon: Droplets,
      description: `${Math.round(avgWater / 7)} كوب/يوم`
    },
    { 
      label: "النشاط", 
      score: Math.round(exerciseScore), 
      icon: Dumbbell,
      description: `${daysWithExercise}/5 أيام تمرين`
    },
  ];

  return (
    <Card className="p-5 border-0 shadow-md overflow-hidden" data-testid="card-life-score">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-lg" data-testid="text-life-score-title">نقاط الصحة الأسبوعية</h3>
      </div>

      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          <div className={cn(
            "w-32 h-32 rounded-full flex items-center justify-center bg-gradient-to-br",
            getScoreBg(totalScore)
          )}>
            <div className="w-24 h-24 rounded-full bg-background flex flex-col items-center justify-center">
              <motion.span 
                className={cn("text-3xl font-bold", getScoreColor(totalScore))}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                data-testid="text-life-score-value"
              >
                {totalScore}
              </motion.span>
              <span className="text-xs text-muted-foreground">من 100</span>
            </div>
          </div>
          <div className={cn(
            "absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium text-white",
            `bg-gradient-to-r ${getScoreBg(totalScore)}`
          )}>
            {getScoreLabel(totalScore)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="bg-muted/50 rounded-xl p-3">
                <Icon className={cn("w-5 h-5 mx-auto mb-1", getScoreColor(metric.score))} />
                <p className={cn("text-lg font-bold", getScoreColor(metric.score))}>{metric.score}%</p>
                <p className="text-xs text-muted-foreground">{metric.label}</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{metric.description}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-primary/5 rounded-xl">
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="font-medium">نصيحة اليوم:</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {totalScore < 40 
            ? "ابدأ بتتبع وجباتك يومياً واشرب 8 أكواب ماء للحصول على نتائج أفضل"
            : totalScore < 60 
            ? "أضف تمارين رياضية لتحسين نقاطك وزيادة حرق السعرات"
            : totalScore < 80 
            ? "أنت تقوم بعمل رائع! حافظ على الاستمرارية لتحقيق أهدافك"
            : "ممتاز! أنت تتبع نمط حياة صحي، استمر على هذا المنوال"
          }
        </p>
      </div>
    </Card>
  );
}
