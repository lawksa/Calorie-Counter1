import { AppLayout } from "@/components/layout/AppLayout";
import { useMeals, useDeleteMeal } from "@/hooks/use-meals";
import { format, subDays } from "date-fns";
import { motion } from "framer-motion";
import { Loader2, Trash2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Meals() {
  // For the Meals page, we might show the last 7 days or similar
  // For simplicity in this demo, showing today + yesterday
  const today = new Date();
  const yesterday = subDays(today, 1);
  
  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Meal History</h1>
          <p className="text-muted-foreground">Review your recent meal logs</p>
        </div>

        <DaySection date={today} label="Today" />
        <DaySection date={yesterday} label="Yesterday" />
      </div>
    </AppLayout>
  );
}

function DaySection({ date, label }: { date: Date, label: string }) {
  const { data: meals, isLoading } = useMeals(date);
  const deleteMeal = useDeleteMeal();

  if (isLoading) return <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;

  if (!meals || meals.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b pb-2">
        <CalendarDays className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">{label}</h2>
        <span className="text-sm text-muted-foreground ml-auto">{format(date, "MMM do")}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {meals.map((meal, index) => (
          <motion.div
            key={meal.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card p-5 rounded-xl border hover:shadow-md transition-shadow relative group"
          >
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                onClick={() => deleteMeal.mutate(meal.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <h3 className="font-semibold text-lg pr-8 truncate">{meal.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">{format(new Date(meal.date), "h:mm a")}</p>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-green-50 text-green-700 px-2 py-1 rounded font-medium">
                {meal.calories} kcal
              </div>
              <div className="bg-orange-50 text-orange-700 px-2 py-1 rounded font-medium">
                {meal.protein}g Protein
              </div>
              <div className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded font-medium">
                {meal.carbs}g Carbs
              </div>
              <div className="bg-purple-50 text-purple-700 px-2 py-1 rounded font-medium">
                {meal.fats}g Fats
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
