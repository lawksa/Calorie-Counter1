import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  Flame,
  Droplets,
  Dumbbell,
  CheckCircle2,
  Circle
} from "lucide-react";
import { motion } from "framer-motion";

interface ProgressCardProps {
  weeklyStats: {
    calories: { date: string; value: number }[];
    water: { date: string; value: number }[];
    exerciseCalories: { date: string; value: number }[];
  } | null;
  goals: {
    calories: number;
    waterGlasses: number;
    burnedCaloriesGoal?: number;
  } | null;
}

export function ProgressCard({ weeklyStats, goals }: ProgressCardProps) {
  const calorieGoal = goals?.calories || 2000;
  const waterGoal = goals?.waterGlasses || 8;
  const exerciseGoal = goals?.burnedCaloriesGoal || 500;

  const daysOfWeek = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  
  const todayIndex = new Date().getDay();
  
  const weekProgress = weeklyStats?.calories.map((day, index) => {
    const caloriesOk = day.value > 0 && day.value <= calorieGoal * 1.1;
    const waterOk = (weeklyStats.water[index]?.value || 0) >= waterGoal;
    const exerciseOk = (weeklyStats.exerciseCalories[index]?.value || 0) >= exerciseGoal * 0.5;
    
    const score = [caloriesOk, waterOk, exerciseOk].filter(Boolean).length;
    return {
      dayName: daysOfWeek[new Date(day.date).getDay()],
      dayShort: daysOfWeek[new Date(day.date).getDay()].slice(0, 1),
      score,
      isToday: new Date(day.date).toDateString() === new Date().toDateString(),
      calories: day.value,
      water: weeklyStats.water[index]?.value || 0,
      exercise: weeklyStats.exerciseCalories[index]?.value || 0,
    };
  }) || [];

  const totalCalories = weeklyStats?.calories.reduce((sum, d) => sum + d.value, 0) || 0;
  const avgCalories = Math.round(totalCalories / 7);
  const weeklyCalorieGoal = calorieGoal * 7;
  const calorieProgress = Math.min(100, (totalCalories / weeklyCalorieGoal) * 100);

  const totalWater = weeklyStats?.water.reduce((sum, d) => sum + d.value, 0) || 0;
  const weeklyWaterGoal = waterGoal * 7;
  const waterProgress = Math.min(100, (totalWater / weeklyWaterGoal) * 100);

  const totalExercise = weeklyStats?.exerciseCalories.reduce((sum, d) => sum + d.value, 0) || 0;
  const weeklyExerciseGoal = exerciseGoal * 7;
  const exerciseProgress = Math.min(100, (totalExercise / weeklyExerciseGoal) * 100);

  const perfectDays = weekProgress.filter(d => d.score === 3).length;
  const streak = calculateStreak(weekProgress);

  return (
    <Card className="p-5 border-0 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          تقدمك الأسبوعي
        </h3>
        {streak > 0 && (
          <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-medium text-orange-600">{streak} يوم</span>
          </div>
        )}
      </div>

      {/* Daily Progress Dots */}
      <div className="flex justify-between mb-6">
        {weekProgress.map((day, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="flex flex-col items-center gap-1"
          >
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                day.score === 3 
                  ? 'bg-green-500 text-white' 
                  : day.score === 2 
                    ? 'bg-yellow-500 text-white'
                    : day.score === 1 
                      ? 'bg-orange-500 text-white'
                      : 'bg-muted text-muted-foreground'
              } ${day.isToday ? 'ring-2 ring-primary ring-offset-2' : ''}`}
            >
              {day.score === 3 ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <span className="text-xs font-bold">{day.score}</span>
              )}
            </div>
            <span className={`text-[10px] ${day.isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
              {day.dayShort}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Weekly Progress Bars */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-primary" />
              <span>السعرات</span>
            </div>
            <span className="text-muted-foreground">
              {totalCalories.toLocaleString()} / {weeklyCalorieGoal.toLocaleString()}
            </span>
          </div>
          <Progress value={calorieProgress} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span>الماء</span>
            </div>
            <span className="text-muted-foreground">
              {totalWater} / {weeklyWaterGoal} كوب
            </span>
          </div>
          <Progress value={waterProgress} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-orange-500" />
              <span>التمارين</span>
            </div>
            <span className="text-muted-foreground">
              {totalExercise.toLocaleString()} / {weeklyExerciseGoal.toLocaleString()} سعرة
            </span>
          </div>
          <Progress value={exerciseProgress} className="h-2" />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{perfectDays}</p>
          <p className="text-[10px] text-muted-foreground">أيام مثالية</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{avgCalories}</p>
          <p className="text-[10px] text-muted-foreground">متوسط السعرات</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-500">{streak}</p>
          <p className="text-[10px] text-muted-foreground">سلسلة الأيام</p>
        </div>
      </div>
    </Card>
  );
}

function calculateStreak(weekProgress: { score: number; isToday: boolean }[]): number {
  let streak = 0;
  const reversed = [...weekProgress].reverse();
  
  for (const day of reversed) {
    if (day.score >= 2) {
      streak++;
    } else if (!day.isToday) {
      break;
    }
  }
  
  return streak;
}
