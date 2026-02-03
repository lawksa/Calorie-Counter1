import { motion } from "framer-motion";

interface SmallCalorieRingProps {
  value: number;
  target: number;
  label: string;
  subLabel?: string;
  gradientId: string;
  gradientColors: [string, string];
  showRemaining?: boolean;
}

export function SmallCalorieRing({ 
  value, 
  target, 
  label, 
  subLabel,
  gradientId,
  gradientColors,
  showRemaining = true
}: SmallCalorieRingProps) {
  const percentage = Math.min(100, Math.round((value / target) * 100));
  const isOver = value > target;
  
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const displayValue = showRemaining 
    ? (isOver ? value - target : Math.max(0, target - value))
    : value;

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={isOver ? "hsl(0 84% 60%)" : `url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientColors[0]} />
              <stop offset="100%" stopColor={gradientColors[1]} />
            </linearGradient>
          </defs>
        </svg>
        
        <div className="absolute flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <span className={`text-xl font-bold ${isOver ? 'text-destructive' : 'text-foreground'}`}>
              {isOver && showRemaining ? '+' : ''}{displayValue}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {subLabel || (showRemaining ? (isOver ? 'زيادة' : 'متبقي') : 'سعرة')}
            </span>
          </motion.div>
        </div>
      </div>
      
      <p className="text-xs font-medium text-muted-foreground mt-2 text-center">{label}</p>
      <p className="text-[10px] text-muted-foreground">الهدف: {target}</p>
    </div>
  );
}
