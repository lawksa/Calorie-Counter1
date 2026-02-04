import { useChallenges, useUserChallenges, useUpdateChallengeProgress } from "@/hooks/use-challenges";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, 
  Droplets, 
  Flame, 
  Beef, 
  UtensilsCrossed, 
  Dumbbell,
  Trophy,
  Check,
  Target,
  Salad,
  CupSoda
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const iconMap: Record<string, any> = {
  droplets: Droplets,
  flame: Flame,
  beef: Beef,
  utensils: UtensilsCrossed,
  dumbbell: Dumbbell,
  fire: Flame,
  salad: Salad,
  "cup-soda": CupSoda,
};

export function DailyChallenges() {
  const { data: userProgress, isLoading: progressLoading } = useUserChallenges();
  const updateProgress = useUpdateChallengeProgress();

  if (progressLoading) {
    return (
      <Card className="p-4 border-0 shadow-sm">
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  const completedCount = userProgress?.filter(p => p.completed).length || 0;
  const totalChallenges = userProgress?.length || 0;
  const totalPoints = userProgress?.filter(p => p.completed).reduce((sum, p) => sum + (p.challenge?.points || 0), 0) || 0;

  const handleManualToggle = async (challengeId: number, challenge: any, isCompleted: boolean) => {
    // Only allow manual toggle for vegetables and no_sugar challenges
    if (challenge.type !== 'vegetables' && challenge.type !== 'no_sugar') return;
    
    await updateProgress.mutateAsync({
      challengeId,
      currentValue: isCompleted ? 0 : challenge.targetValue,
      completed: !isCompleted,
    });
  };

  const getProgressText = (progress: any) => {
    const challenge = progress.challenge;
    if (!challenge) return "";
    
    switch (challenge.type) {
      case 'water':
        return `${progress.currentValue}/${challenge.targetValue} أكواب`;
      case 'calories':
        return progress.completed ? "تم الالتزام" : "لم يتم بعد";
      case 'protein':
        return progress.completed ? "تم التحقيق" : "لم يتم بعد";
      case 'meals':
        return `${progress.currentValue}/${challenge.targetValue} وجبات`;
      case 'exercise':
        return `${progress.currentValue}/${challenge.targetValue} دقيقة`;
      case 'exercise_calories':
        return `${progress.currentValue}/${challenge.targetValue} سعرة`;
      case 'vegetables':
        return progress.completed ? "تم" : "اضغط للتأكيد";
      case 'no_sugar':
        return progress.completed ? "تم" : "اضغط للتأكيد";
      default:
        return "";
    }
  };

  const getProgressPercent = (progress: any) => {
    const challenge = progress.challenge;
    if (!challenge) return 0;
    if (progress.completed) return 100;
    if (challenge.targetValue === 0) return 0;
    return Math.min(100, (progress.currentValue / challenge.targetValue) * 100);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          التحديات اليومية
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{completedCount}/{totalChallenges}</span>
          <span className="font-bold text-primary">+{totalPoints} نقطة</span>
        </div>
      </div>

      <div className="space-y-2">
        {userProgress?.slice(0, 6).map((progress, index) => {
          const challenge = progress.challenge;
          if (!challenge) return null;
          
          const isCompleted = progress.completed;
          const Icon = iconMap[challenge.icon || 'target'] || Target;
          const isManualChallenge = challenge.type === 'vegetables' || challenge.type === 'no_sugar';
          const progressPercent = getProgressPercent(progress);

          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card 
                className={cn(
                  "p-3 border-0 shadow-sm transition-all",
                  isCompleted && "bg-primary/5 border border-primary/20",
                  isManualChallenge && "cursor-pointer hover:bg-muted/50"
                )}
                onClick={() => isManualChallenge && handleManualToggle(challenge.id, challenge, isCompleted)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0",
                    isCompleted 
                      ? "bg-primary text-white" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn(
                        "font-medium text-sm truncate",
                        isCompleted && "text-muted-foreground"
                      )}>
                        {challenge.titleAr}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {getProgressText(progress)}
                      </span>
                    </div>
                    <Progress 
                      value={progressPercent} 
                      className="h-1.5 mt-1.5"
                    />
                  </div>
                  
                  <div className={cn(
                    "px-2 py-1 rounded-full text-xs font-bold shrink-0",
                    isCompleted 
                      ? "bg-primary text-white" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    +{challenge.points}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
