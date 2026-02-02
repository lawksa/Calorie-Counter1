import { motion } from "framer-motion";
import { Droplets, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WaterTrackerProps {
  glasses: number;
  target: number;
  onUpdate: (glasses: number) => void;
  isPending?: boolean;
}

export function WaterTracker({ glasses, target, onUpdate, isPending }: WaterTrackerProps) {
  const percentage = Math.min(100, Math.round((glasses / target) * 100));
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-bold">الماء</h3>
            <p className="text-sm text-muted-foreground">
              {glasses} من {target} أكواب
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl"
            onClick={() => glasses > 0 && onUpdate(glasses - 1)}
            disabled={isPending || glasses === 0}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            className="h-10 w-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500"
            onClick={() => onUpdate(glasses + 1)}
            disabled={isPending}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Water glasses visualization */}
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: target }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className={cn(
              "w-8 h-10 rounded-lg flex items-center justify-center transition-colors duration-300",
              i < glasses 
                ? "bg-gradient-to-b from-blue-400 to-blue-500 text-white" 
                : "bg-muted"
            )}
          >
            <Droplets className={cn(
              "w-4 h-4",
              i < glasses ? "text-white" : "text-muted-foreground/40"
            )} />
          </motion.div>
        ))}
      </div>
      
      {/* Progress bar */}
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <motion.div 
          className="h-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-500"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
