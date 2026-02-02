import { AppLayout } from "@/components/layout/AppLayout";
import { useGoals, useUpdateGoals } from "@/hooks/use-goals";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertGoalSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const formSchema = insertGoalSchema.extend({
  calories: z.coerce.number().min(100),
  protein: z.coerce.number().min(0),
  carbs: z.coerce.number().min(0),
  fats: z.coerce.number().min(0),
});

type FormValues = z.infer<typeof formSchema>;

export default function Settings() {
  const { data: goals, isLoading } = useGoals();
  const updateGoals = useUpdateGoals();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      calories: 2000,
      protein: 150,
      carbs: 200,
      fats: 65,
    },
  });

  useEffect(() => {
    if (goals) {
      form.reset(goals);
    }
  }, [goals, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      await updateGoals.mutateAsync(data);
      toast({
        title: "Goals Updated",
        description: "Your nutrition targets have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update goals.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your preferences and goals</p>
        </div>

        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <CardTitle>Nutrition Goals</CardTitle>
            </div>
            <CardDescription>
              Set your daily targets for calories and macronutrients.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="calories" className="text-lg font-medium">Daily Calorie Target</Label>
                <div className="relative">
                  <Input 
                    id="calories" 
                    type="number" 
                    {...form.register("calories")} 
                    className="pl-4 h-12 text-lg font-bold border-primary/20 focus-visible:ring-primary"
                  />
                  <div className="absolute right-4 top-3 text-muted-foreground font-medium">kcal</div>
                </div>
                <p className="text-sm text-muted-foreground">
                  This is your main energy budget for the day.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="protein" className="text-orange-700 font-medium">Protein (g)</Label>
                  <Input 
                    id="protein" 
                    type="number" 
                    {...form.register("protein")}
                    className="border-orange-200 focus-visible:ring-orange-500 bg-orange-50/30" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carbs" className="text-yellow-700 font-medium">Carbs (g)</Label>
                  <Input 
                    id="carbs" 
                    type="number" 
                    {...form.register("carbs")} 
                    className="border-yellow-200 focus-visible:ring-yellow-500 bg-yellow-50/30" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fats" className="text-purple-700 font-medium">Fats (g)</Label>
                  <Input 
                    id="fats" 
                    type="number" 
                    {...form.register("fats")} 
                    className="border-purple-200 focus-visible:ring-purple-500 bg-purple-50/30" 
                  />
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full sm:w-auto"
                  disabled={updateGoals.isPending}
                >
                  {updateGoals.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
