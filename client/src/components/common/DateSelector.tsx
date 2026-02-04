import { format, addDays, subDays, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { ar } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

interface DaySummary {
  calories: number;
  calorieGoal: number;
  water: number;
  waterGoal: number;
  mealsCount: number;
  adherence: number;
}

interface DateSelectorProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

export function DateSelector({ date, onDateChange }: DateSelectorProps) {
  // Get week days
  const weekStart = startOfWeek(date, { weekStartsOn: 6 }); // Saturday
  const weekEnd = endOfWeek(date, { weekStartsOn: 6 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  const isToday = isSameDay(date, new Date());

  // Fetch weekly summary
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const { data: weeklySummary } = useQuery<Record<string, DaySummary>>({
    queryKey: ['/api/weekly-summary', weekStartStr],
    queryFn: async () => {
      const res = await fetch(`/api/weekly-summary?date=${weekStartStr}`);
      if (!res.ok) throw new Error('Failed to fetch weekly summary');
      return res.json();
    },
    staleTime: 30000,
  });

  const getAdherenceGradient = (adherence: number) => {
    if (adherence >= 80) return "from-green-500/40 to-green-600/40";
    if (adherence >= 50) return "from-yellow-500/40 to-yellow-600/40";
    if (adherence > 0) return "from-orange-500/40 to-orange-600/40";
    return "";
  };

  const getAdherenceBorder = (adherence: number) => {
    if (adherence >= 80) return "border-green-500";
    if (adherence >= 50) return "border-yellow-500";
    if (adherence > 0) return "border-orange-500";
    return "border-border";
  };

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-xl"
          onClick={() => onDateChange(subDays(date, 7))}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
        
        <div className="text-center">
          <h2 className="font-bold text-lg">
            {isToday ? "اليوم" : format(date, "EEEE", { locale: ar })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {format(date, "d MMMM yyyy", { locale: ar })}
          </p>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-xl"
          onClick={() => onDateChange(addDays(date, 7))}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Week days strip */}
      <div className="flex gap-2 justify-between">
        {weekDays.map((day, index) => {
          const isSelected = isSameDay(day, date);
          const isDayToday = isSameDay(day, new Date());
          const dateKey = format(day, 'yyyy-MM-dd');
          const daySummary = weeklySummary?.[dateKey];
          const adherence = daySummary?.adherence || 0;
          const hasData = daySummary && daySummary.mealsCount > 0;
          
          return (
            <motion.button
              key={day.toISOString()}
              onClick={() => onDateChange(day)}
              className={cn(
                "flex-1 flex flex-col items-center py-3 rounded-2xl transition-all duration-300 relative overflow-hidden border",
                isSelected 
                  ? "bg-gradient-to-br from-primary to-emerald-500 text-white shadow-lg shadow-primary/25 border-transparent" 
                  : hasData 
                    ? cn("bg-card hover:bg-muted/50", getAdherenceBorder(adherence))
                    : "bg-card border-border hover:bg-muted/50"
              )}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              data-testid={`date-${dateKey}`}
            >
              {/* Adherence fill background */}
              {hasData && !isSelected && (
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
              
              <span className={cn(
                "text-xs font-medium mb-1 relative z-10",
                isSelected ? "text-white/80" : "text-muted-foreground"
              )}>
                {format(day, "EEE", { locale: ar })}
              </span>
              <span className={cn(
                "text-lg font-bold relative z-10",
                isDayToday && !isSelected && "text-primary"
              )}>
                {format(day, "d")}
              </span>
              
              {/* Adherence percentage */}
              {hasData && !isSelected && (
                <span className="text-[10px] font-medium text-muted-foreground relative z-10 mt-0.5">
                  {adherence}%
                </span>
              )}
              
              {/* Today indicator */}
              {isDayToday && !hasData && !isSelected && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 relative z-10" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
