import { useDailyHabit, useUpdateDailyHabit } from "@/hooks/use-daily-habits";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Apple, Carrot, Moon, Footprints, Plus, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { DailyHabit } from "@shared/schema";

type HabitKey = "fruitsServings" | "vegetablesServings" | "sleepHours" | "steps";

const habits: Array<{
  key: HabitKey;
  label: string;
  icon: typeof Apple;
  color: string;
  bgColor: string;
  target: number;
  unit: string;
  isMinutes?: boolean;
}> = [
  { key: "fruitsServings", label: "الفواكه", icon: Apple, color: "text-red-500", bgColor: "bg-red-500/10", target: 2, unit: "حصة" },
  { key: "vegetablesServings", label: "الخضروات", icon: Carrot, color: "text-orange-500", bgColor: "bg-orange-500/10", target: 3, unit: "حصة" },
  { key: "sleepHours", label: "النوم", icon: Moon, color: "text-indigo-500", bgColor: "bg-indigo-500/10", target: 480, unit: "ساعة", isMinutes: true },
  { key: "steps", label: "الخطوات", icon: Footprints, color: "text-green-500", bgColor: "bg-green-500/10", target: 10000, unit: "خطوة" },
];

export function HabitsTracker() {
  const { data: habit, isLoading } = useDailyHabit();
  const updateHabit = useUpdateDailyHabit();

  const handleIncrement = async (key: HabitKey, increment: number) => {
    if (!habit && !updateHabit.isPending) {
      await updateHabit.mutateAsync({ [key]: increment > 0 ? increment : 0 });
      return;
    }
    
    const currentValue = habit?.[key] || 0;
    const newValue = Math.max(0, currentValue + increment);
    await updateHabit.mutateAsync({ [key]: newValue });
  };

  if (isLoading) {
    return (
      <Card className="p-4 border-0 shadow-sm">
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">العادات اليومية</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {habits.map((item, index) => {
          const Icon = item.icon;
          const value = (habit as any)?.[item.key] || 0;
          const displayValue = item.isMinutes ? Math.round(value / 60 * 10) / 10 : value;
          const progress = Math.min(100, (value / item.target) * 100);
          const increment = item.isMinutes ? 60 : 1;
          
          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className={cn("p-3 border-0 shadow-sm", item.bgColor)}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn("w-5 h-5", item.color)} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-2xl font-bold">{displayValue}</span>
                    <span className="text-xs text-muted-foreground mr-1">{item.unit}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleIncrement(item.key, -increment)}
                      disabled={updateHabit.isPending}
                      data-testid={`button-${item.key}-minus`}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleIncrement(item.key, increment)}
                      disabled={updateHabit.isPending}
                      data-testid={`button-${item.key}-plus`}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", item.color.replace('text-', 'bg-'))}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
