import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dumbbell, 
  Clock, 
  Flame, 
  ChevronRight,
  Play,
  Target,
  Zap,
  Scale,
  TrendingUp,
  Home,
  Check,
  Info,
  Trophy,
  Weight,
  LucideIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { workoutPlans, WorkoutPlan, WorkoutDay } from "@/data/workoutPlans";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const goalIcons: Record<string, LucideIcon> = {
  cut: Flame,
  bulk: TrendingUp,
  maintain: Scale,
  strength: Dumbbell,
  endurance: Zap,
};

const planIcons: Record<string, LucideIcon> = {
  Flame: Flame,
  Dumbbell: Dumbbell,
  Trophy: Trophy,
  Scale: Scale,
  Weight: Weight,
  Home: Home,
};

const goalColors: Record<string, string> = {
  cut: "bg-orange-500",
  bulk: "bg-green-500",
  maintain: "bg-blue-500",
  strength: "bg-purple-500",
  endurance: "bg-pink-500",
};

interface WorkoutPlansProps {
  onStartWorkout?: (exercises: any[]) => void;
}

export function WorkoutPlans({ onStartWorkout }: WorkoutPlansProps) {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState<WorkoutDay | null>(null);
  const [showDaySheet, setShowDaySheet] = useState(false);

  const goals = [
    { id: "cut", label: "تنشيف", icon: Flame, color: "from-orange-500 to-red-500", description: "حرق الدهون" },
    { id: "bulk", label: "تضخيم", icon: TrendingUp, color: "from-green-500 to-emerald-600", description: "بناء العضلات" },
    { id: "maintain", label: "ثبات", icon: Scale, color: "from-blue-500 to-indigo-600", description: "المحافظة" },
    { id: "strength", label: "قوة", icon: Dumbbell, color: "from-purple-500 to-violet-600", description: "زيادة القوة" },
    { id: "endurance", label: "تحمل", icon: Home, color: "from-pink-500 to-rose-600", description: "بدون معدات" },
  ];

  const filteredPlans = selectedGoal 
    ? workoutPlans.filter(p => p.goal === selectedGoal)
    : workoutPlans;

  const handleDayClick = (day: WorkoutDay) => {
    setSelectedDay(day);
    setShowDaySheet(true);
  };

  return (
    <div className="space-y-6">
      {/* Goal Selector */}
      <div className="space-y-3">
        <h3 className="font-bold text-lg">اختر هدفك</h3>
        <div className="grid grid-cols-5 gap-2">
          {goals.map((goal) => {
            const Icon = goal.icon;
            const isSelected = selectedGoal === goal.id;
            return (
              <motion.button
                key={goal.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedGoal(isSelected ? null : goal.id)}
                className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                  isSelected 
                    ? `bg-gradient-to-br ${goal.color} text-white shadow-lg` 
                    : "bg-muted/50 hover-elevate"
                }`}
                data-testid={`button-goal-${goal.id}`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isSelected ? "text-white" : "text-muted-foreground"}`} />
                <span className="text-xs font-medium">{goal.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Plans List */}
      <div className="space-y-3">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          خطط التمارين
          <Badge variant="secondary" className="ms-auto">{filteredPlans.length} خطة</Badge>
        </h3>

        <div className="space-y-3">
          {filteredPlans.map((plan) => {
            const GoalIcon = goalIcons[plan.goal];
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card 
                  className="p-4 border-0 shadow-md hover-elevate cursor-pointer"
                  onClick={() => setSelectedPlan(plan)}
                  data-testid={`card-plan-${plan.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-md`}>
                      {(() => {
                        const PlanIcon = planIcons[plan.icon] || Dumbbell;
                        return <PlanIcon className="w-7 h-7 text-white" />;
                      })()}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold">{plan.nameAr}</h4>
                      <p className="text-xs text-muted-foreground">{plan.descriptionAr}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {plan.levelAr}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {plan.daysPerWeek} أيام/أسبوع
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground rtl:rotate-180" />
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Plan Details Dialog */}
      <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {selectedPlan && (
            <>
              <DialogHeader>
                <div className={`w-full h-24 rounded-xl bg-gradient-to-br ${selectedPlan.color} flex items-center justify-center mb-4`}>
                  {(() => {
                    const PlanIcon = planIcons[selectedPlan.icon] || Dumbbell;
                    return <PlanIcon className="w-12 h-12 text-white" />;
                  })()}
                </div>
                <DialogTitle className="text-xl">{selectedPlan.nameAr}</DialogTitle>
                <p className="text-muted-foreground text-sm">{selectedPlan.descriptionAr}</p>
              </DialogHeader>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`${goalColors[selectedPlan.goal]} text-white`}>
                  {selectedPlan.goalAr}
                </Badge>
                <Badge variant="outline">{selectedPlan.levelAr}</Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {selectedPlan.daysPerWeek} أيام
                </Badge>
              </div>

              <div className="space-y-3 mt-4">
                <h4 className="font-bold text-sm text-muted-foreground">أيام التمرين</h4>
                {selectedPlan.days.map((day, index) => (
                  <Card 
                    key={index}
                    className="p-4 border-0 bg-muted/50 hover-elevate cursor-pointer"
                    onClick={() => handleDayClick(day)}
                    data-testid={`card-day-${day.dayNumber}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">{day.dayNumber}</span>
                          </div>
                          <div>
                            <h5 className="font-bold text-sm">{day.nameAr}</h5>
                            <p className="text-xs text-muted-foreground">{day.focusAr}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {day.estimatedDuration} د
                        </div>
                        <div className="flex items-center gap-2 text-xs text-orange-500">
                          <Flame className="w-3 h-3" />
                          {day.estimatedCalories} سعرة
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {day.exercises.length} تمرين
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Day Details Sheet */}
      <Sheet open={showDaySheet} onOpenChange={setShowDaySheet}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          {selectedDay && selectedPlan && (
            <div className="space-y-4 pb-6">
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedPlan.color} flex items-center justify-center`}>
                    <span className="text-xl font-bold text-white">{selectedDay.dayNumber}</span>
                  </div>
                  <div>
                    <SheetTitle>{selectedDay.nameAr}</SheetTitle>
                    <p className="text-sm text-muted-foreground">{selectedDay.focusAr}</p>
                  </div>
                </div>
              </SheetHeader>

              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{selectedDay.estimatedDuration} دقيقة</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">{selectedDay.estimatedCalories} سعرة</span>
                </div>
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-primary" />
                  <span className="text-sm">{selectedDay.exercises.length} تمرين</span>
                </div>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                {selectedDay.exercises.map((exercise, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="p-4 border-0 bg-muted/30">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                          <span className="text-xs font-bold text-primary">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-bold text-sm">{exercise.nameAr}</h5>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="bg-muted px-2 py-0.5 rounded">{exercise.sets} مجموعات</span>
                            <span className="bg-muted px-2 py-0.5 rounded">{exercise.reps} تكرار</span>
                            {exercise.restSeconds > 0 && (
                              <span className="bg-muted px-2 py-0.5 rounded">راحة {exercise.restSeconds}ث</span>
                            )}
                          </div>
                          {exercise.tips && (
                            <div className="flex items-start gap-1 mt-2 text-xs text-amber-600 dark:text-amber-400">
                              <Info className="w-3 h-3 mt-0.5 shrink-0" />
                              <span>{exercise.tips}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <Button 
                size="lg"
                className="w-full text-lg font-bold bg-gradient-to-r from-primary to-emerald-500 rounded-xl shadow-lg"
                onClick={() => {
                  if (onStartWorkout) {
                    onStartWorkout(selectedDay.exercises);
                  }
                  setShowDaySheet(false);
                }}
                data-testid="button-start-workout"
              >
                <Play className="w-5 h-5 me-2" />
                ابدأ التمرين
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
