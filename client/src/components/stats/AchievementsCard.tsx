import { Card } from "@/components/ui/card";
import { 
  Trophy,
  Flame,
  Star,
  Crown,
  Medal,
  Target,
  Zap,
  Heart,
  Award,
  Sparkles,
  Lock
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Achievement {
  id: string;
  icon: any;
  title: string;
  description: string;
  requirement: number;
  color: string;
  bgColor: string;
}

const achievements: Achievement[] = [
  {
    id: "streak_3",
    icon: Flame,
    title: "بداية موفقة",
    description: "حافظ على أهدافك 3 أيام متتالية",
    requirement: 3,
    color: "text-orange-500",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
  {
    id: "streak_7",
    icon: Star,
    title: "نجم الأسبوع",
    description: "حافظ على أهدافك أسبوع كامل",
    requirement: 7,
    color: "text-yellow-500",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  {
    id: "streak_14",
    icon: Zap,
    title: "محارب اللياقة",
    description: "حافظ على أهدافك أسبوعين",
    requirement: 14,
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    id: "streak_21",
    icon: Target,
    title: "عادة صحية",
    description: "حافظ على أهدافك 21 يوم",
    requirement: 21,
    color: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  {
    id: "streak_30",
    icon: Medal,
    title: "بطل الشهر",
    description: "حافظ على أهدافك شهر كامل",
    requirement: 30,
    color: "text-purple-500",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    id: "streak_60",
    icon: Award,
    title: "المثابر",
    description: "حافظ على أهدافك شهرين",
    requirement: 60,
    color: "text-pink-500",
    bgColor: "bg-pink-100 dark:bg-pink-900/30",
  },
  {
    id: "streak_90",
    icon: Heart,
    title: "عاشق الصحة",
    description: "حافظ على أهدافك 3 أشهر",
    requirement: 90,
    color: "text-red-500",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
  {
    id: "streak_180",
    icon: Crown,
    title: "الملك",
    description: "حافظ على أهدافك 6 أشهر",
    requirement: 180,
    color: "text-amber-500",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  {
    id: "streak_365",
    icon: Sparkles,
    title: "الأسطورة",
    description: "حافظ على أهدافك سنة كاملة",
    requirement: 365,
    color: "text-cyan-500",
    bgColor: "bg-gradient-to-r from-cyan-100 to-purple-100 dark:from-cyan-900/30 dark:to-purple-900/30",
  },
];

interface AchievementsCardProps {
  currentStreak: number;
  totalPerfectDays: number;
}

export function AchievementsCard({ currentStreak, totalPerfectDays }: AchievementsCardProps) {
  const unlockedCount = achievements.filter(a => currentStreak >= a.requirement).length;
  const nextAchievement = achievements.find(a => currentStreak < a.requirement);
  const progress = nextAchievement 
    ? Math.round((currentStreak / nextAchievement.requirement) * 100)
    : 100;

  return (
    <Card className="p-5 border-0 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          شجرة الإنجازات
        </h3>
        <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full">
          <span className="text-xs font-medium text-primary">{unlockedCount}/{achievements.length}</span>
        </div>
      </div>

      {/* Current Streak Display */}
      <div className="flex items-center justify-center gap-6 mb-6 p-4 rounded-xl bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Flame className="w-6 h-6 text-orange-500" />
            <span className="text-3xl font-bold text-orange-600">{currentStreak}</span>
          </div>
          <p className="text-xs text-muted-foreground">سلسلة الأيام الحالية</p>
        </div>
        <div className="h-10 w-px bg-border" />
        <div className="text-center">
          <span className="text-3xl font-bold text-green-600">{totalPerfectDays}</span>
          <p className="text-xs text-muted-foreground">إجمالي الأيام المثالية</p>
        </div>
      </div>

      {/* Next Achievement Progress */}
      {nextAchievement && (
        <div className="mb-4 p-3 rounded-xl bg-muted/50">
          <div className="flex items-center gap-3 mb-2">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", nextAchievement.bgColor)}>
              <nextAchievement.icon className={cn("w-4 h-4", nextAchievement.color)} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">التالي: {nextAchievement.title}</p>
              <p className="text-xs text-muted-foreground">
                {nextAchievement.requirement - currentStreak} يوم متبقي
              </p>
            </div>
            <span className="text-sm font-bold text-primary">{progress}%</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <motion.div 
              className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Achievements Tree */}
      <div className="relative">
        {/* Connecting Line */}
        <div className="absolute right-6 top-0 bottom-0 w-0.5 bg-muted" />
        
        <div className="space-y-3">
          {achievements.map((achievement, index) => {
            const isUnlocked = currentStreak >= achievement.requirement;
            const isNext = achievement === nextAchievement;
            
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "relative flex items-center gap-3 p-3 rounded-xl transition-all",
                  isUnlocked 
                    ? achievement.bgColor 
                    : "bg-muted/30",
                  isNext && "ring-2 ring-primary ring-offset-2"
                )}
              >
                {/* Node */}
                <div className={cn(
                  "relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  isUnlocked 
                    ? achievement.bgColor 
                    : "bg-muted"
                )}>
                  {isUnlocked ? (
                    <achievement.icon className={cn("w-5 h-5", achievement.color)} />
                  ) : (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium text-sm truncate",
                    !isUnlocked && "text-muted-foreground"
                  )}>
                    {achievement.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {achievement.description}
                  </p>
                </div>
                
                <div className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full shrink-0",
                  isUnlocked 
                    ? "bg-green-100 text-green-600 dark:bg-green-900/50" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {isUnlocked ? "مفتوح" : `${achievement.requirement} يوم`}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
