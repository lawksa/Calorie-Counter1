import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MacroCardProps {
  label: string;
  consumed: number;
  target: number;
  color: string;
  unit?: string;
}

export function MacroCard({ label, consumed, target, color, unit = "g" }: MacroCardProps) {
  const percentage = Math.min(100, Math.round((consumed / target) * 100));
  
  return (
    <div className="bg-card rounded-2xl p-5 border shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-display">{consumed}</span>
            <span className="text-sm text-muted-foreground">/ {target}{unit}</span>
          </div>
        </div>
        <span className="text-sm font-bold" style={{ color }}>{percentage}%</span>
      </div>
      
      <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
        <motion.div 
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
