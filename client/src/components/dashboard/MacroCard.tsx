import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface MacroCardProps {
  label: string;
  consumed: number;
  target: number;
  color: string;
  icon: LucideIcon;
  unit?: string;
}

export function MacroCard({ label, consumed, target, color, icon: Icon, unit = "غ" }: MacroCardProps) {
  const percentage = Math.min(100, Math.round((consumed / target) * 100));
  const isOver = consumed > target;
  
  return (
    <div className="flex items-center gap-3">
      {/* Icon */}
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <div className="text-sm">
            <span className={cn("font-bold", isOver && "text-destructive")}>{consumed}</span>
            <span className="text-muted-foreground">/{target}{unit}</span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <motion.div 
            className="h-full rounded-full"
            style={{ backgroundColor: isOver ? "hsl(0 84% 60%)" : color }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentage, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}
