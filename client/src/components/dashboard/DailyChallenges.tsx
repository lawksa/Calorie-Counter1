import { useChallenges, useUserChallenges, useUpdateChallengeProgress } from "@/hooks/use-challenges";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Droplets, 
  Flame, 
  Beef, 
  UtensilsCrossed, 
  Dumbbell,
  Trophy,
  Check,
  Target
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
  salad: UtensilsCrossed,
  "cup-soda": Droplets,
};

export function DailyChallenges() {
  const { data: challenges, isLoading: challengesLoading } = useChallenges();
  const { data: userProgress, isLoading: progressLoading } = useUserChallenges();
  const updateProgress = useUpdateChallengeProgress();

  if (challengesLoading || progressLoading) {
    return (
      <Card className="p-4 border-0 shadow-sm">
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  const completedCount = userProgress?.filter(p => p.completed).length || 0;
  const totalPoints = userProgress?.filter(p => p.completed).reduce((sum, p) => sum + (p.challenge?.points || 0), 0) || 0;

  const handleToggle = async (challengeId: number, isCompleted: boolean) => {
    const challenge = challenges?.find(c => c.id === challengeId);
    if (!challenge) return;
    
    await updateProgress.mutateAsync({
      challengeId,
      currentValue: isCompleted ? 0 : challenge.targetValue,
      completed: !isCompleted,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          التحديات اليومية
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{completedCount}/{challenges?.length || 0}</span>
          <span className="font-bold text-primary">+{totalPoints} نقطة</span>
        </div>
      </div>

      <div className="space-y-2">
        {challenges?.slice(0, 4).map((challenge, index) => {
          const progress = userProgress?.find(p => p.challengeId === challenge.id);
          const isCompleted = progress?.completed || false;
          const Icon = iconMap[challenge.icon || 'target'] || Target;

          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card 
                className={cn(
                  "p-3 border-0 shadow-sm transition-all cursor-pointer",
                  isCompleted && "bg-primary/5 border border-primary/20"
                )}
                onClick={() => handleToggle(challenge.id, isCompleted)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
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
                  
                  <div className="flex-1">
                    <p className={cn(
                      "font-medium text-sm",
                      isCompleted && "line-through text-muted-foreground"
                    )}>
                      {challenge.titleAr}
                    </p>
                    <p className="text-xs text-muted-foreground">{challenge.descriptionAr}</p>
                  </div>
                  
                  <div className={cn(
                    "px-2 py-1 rounded-full text-xs font-bold",
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
