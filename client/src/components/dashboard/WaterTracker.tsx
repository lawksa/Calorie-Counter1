import { motion } from "framer-motion";
import { Droplets, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WaterTrackerProps {
  glasses: number;
  target: number;
  onUpdate: (glasses: number) => void;
  isPending?: boolean;
}

export function WaterTracker({ glasses, target, onUpdate, isPending }: WaterTrackerProps) {
  const mlConsumed = glasses * 100;
  const targetMl = 3000;
  const percentage = Math.min(100, Math.round((mlConsumed / targetMl) * 100));
  
  const formatMl = (ml: number) => {
    if (ml >= 1000) {
      return `${(ml / 1000).toFixed(1)} لتر`;
    }
    return `${ml} مل`;
  };
  
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
              {formatMl(mlConsumed)} من {formatMl(targetMl)}
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
            data-testid="button-water-decrease"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <div className="text-center min-w-[50px]">
            <span className="text-lg font-bold">{mlConsumed}</span>
            <span className="text-xs text-muted-foreground mr-1">مل</span>
          </div>
          <Button
            size="icon"
            className="h-10 w-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500"
            onClick={() => onUpdate(glasses + 1)}
            disabled={isPending}
            data-testid="button-water-increase"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Water level visualization */}
      <div className="relative h-32 bg-muted rounded-2xl overflow-hidden">
        <motion.div 
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-cyan-400"
          initial={{ height: 0 }}
          animate={{ height: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-2 left-0 right-0 h-1 bg-white/40 rounded-full mx-4" />
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-white/30 rounded-full mx-6" />
          </div>
        </motion.div>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            className="text-3xl font-bold text-foreground"
            key={percentage}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {percentage}%
          </motion.span>
          <span className="text-xs text-muted-foreground">
            +100 مل لكل ضغطة
          </span>
        </div>
      </div>
      
      {/* Quick add buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs"
          onClick={() => onUpdate(glasses + 2)}
          disabled={isPending}
          data-testid="button-water-add-200"
        >
          +200 مل
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs"
          onClick={() => onUpdate(glasses + 5)}
          disabled={isPending}
          data-testid="button-water-add-500"
        >
          +500 مل
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs"
          onClick={() => onUpdate(glasses + 10)}
          disabled={isPending}
          data-testid="button-water-add-1000"
        >
          +1 لتر
        </Button>
      </div>
    </div>
  );
}
