import { useState } from "react";
import { format } from "date-fns";
import { useMeals, useDeleteMeal } from "@/hooks/use-meals";
import { useGoals } from "@/hooks/use-goals";
import { AppLayout } from "@/components/layout/AppLayout";
import { CalorieRing } from "@/components/dashboard/CalorieRing";
import { MacroCard } from "@/components/dashboard/MacroCard";
import { DateSelector } from "@/components/common/DateSelector";
import { AddMealDialog } from "@/components/meals/AddMealDialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Utensils } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [date, setDate] = useState<Date>(new Date());
  const { data: meals, isLoading: mealsLoading } = useMeals(date);
  const { data: goals, isLoading: goalsLoading } = useGoals();
  const deleteMeal = useDeleteMeal();

  if (mealsLoading || goalsLoading) {
    return (
      <AppLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // Calculate totals
  const totals = meals?.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fats: acc.fats + meal.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  ) || { calories: 0, protein: 0, carbs: 0, fats: 0 };

  const target = goals || {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fats: 65,
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Track your nutrition for today</p>
          </div>
          <div className="flex items-center gap-3">
            <DateSelector date={date} onDateChange={setDate} />
            <AddMealDialog date={date} />
          </div>
        </div>

        {/* Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Calorie Ring Card */}
          <motion.div 
            className="md:col-span-1 bg-card rounded-3xl p-6 border shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-lg font-semibold mb-4 text-center">Calories</h2>
            <CalorieRing consumed={totals.calories} target={target.calories} />
          </motion.div>

          {/* Macros Grid */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.2 }}
            >
              <MacroCard 
                label="Protein" 
                consumed={totals.protein} 
                target={target.protein} 
                color="hsl(24 95% 53%)" // Orange
              />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.3 }}
            >
              <MacroCard 
                label="Carbs" 
                consumed={totals.carbs} 
                target={target.carbs} 
                color="hsl(47 95% 57%)" // Yellow
              />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.4 }}
            >
              <MacroCard 
                label="Fats" 
                consumed={totals.fats} 
                target={target.fats} 
                color="hsl(262 83% 58%)" // Purple
              />
            </motion.div>
          </div>
        </div>

        {/* Meals List */}
        <div className="mt-4">
          <h2 className="text-xl font-bold font-display mb-4">Today's Meals</h2>
          
          <div className="space-y-3">
            {meals && meals.length > 0 ? (
              meals.map((meal, index) => (
                <motion.div 
                  key={meal.id} 
                  className="bg-card p-4 rounded-xl border shadow-sm flex items-center justify-between group hover:border-primary/50 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                    <div>
                      <h3 className="font-semibold text-lg">{meal.name}</h3>
                      <p className="text-xs text-muted-foreground">{format(new Date(meal.date), "h:mm a")}</p>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span className="font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">{meal.calories} kcal</span>
                      <span><span className="font-medium text-foreground">{meal.protein}g</span> P</span>
                      <span><span className="font-medium text-foreground">{meal.carbs}g</span> C</span>
                      <span><span className="font-medium text-foreground">{meal.fats}g</span> F</span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteMeal.mutate(meal.id)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed">
                <Utensils className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium text-muted-foreground">No meals logged yet</h3>
                <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto mt-1">
                  Click "Add Meal" to start tracking your nutrition for today.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
