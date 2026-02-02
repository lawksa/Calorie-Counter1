import { format, addDays, subDays, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { ar } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
          
          return (
            <motion.button
              key={day.toISOString()}
              onClick={() => onDateChange(day)}
              className={cn(
                "flex-1 flex flex-col items-center py-3 rounded-2xl transition-all duration-300",
                isSelected 
                  ? "bg-gradient-to-br from-primary to-emerald-500 text-white shadow-lg shadow-primary/25" 
                  : "bg-card border hover:bg-muted/50"
              )}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              data-testid={`date-${format(day, "yyyy-MM-dd")}`}
            >
              <span className={cn(
                "text-xs font-medium mb-1",
                isSelected ? "text-white/80" : "text-muted-foreground"
              )}>
                {format(day, "EEE", { locale: ar })}
              </span>
              <span className={cn(
                "text-lg font-bold",
                isDayToday && !isSelected && "text-primary"
              )}>
                {format(day, "d")}
              </span>
              {isDayToday && (
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full mt-1",
                  isSelected ? "bg-white" : "bg-primary"
                )} />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
