import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Loader2, Sparkles, Plus, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCreateMeal, useEstimateCalories } from "@/hooks/use-meals";
import { insertMealSchema } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";

// Schema for manual entry form
const formSchema = insertMealSchema.extend({
  calories: z.coerce.number().min(0),
  protein: z.coerce.number().min(0),
  carbs: z.coerce.number().min(0),
  fats: z.coerce.number().min(0),
});

type FormValues = z.infer<typeof formSchema>;

export function AddMealDialog({ date }: { date: Date }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createMeal = useCreateMeal();
  const estimateCalories = useEstimateCalories();
  
  // AI Estimation State
  const [query, setQuery] = useState("");
  const [estimatedData, setEstimatedData] = useState<FormValues | null>(null);

  // Manual Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
    },
  });

  const handleEstimate = async () => {
    if (!query.trim()) return;
    try {
      const result = await estimateCalories.mutateAsync(query);
      setEstimatedData(result);
      // Pre-fill form in case user switches tabs or confirms
      form.reset(result);
    } catch (error) {
      toast({
        title: "Estimation Failed",
        description: "Could not analyze the meal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      // Pass the currently selected date to the backend
      const mealDate = new Date(date);
      // Set to current time to preserve order, but on the selected day
      const now = new Date();
      mealDate.setHours(now.getHours(), now.getMinutes());

      await createMeal.mutateAsync({
        ...data,
        date: mealDate.toISOString(),
      });
      
      toast({
        title: "Meal Added",
        description: `${data.name} has been logged.`,
      });
      setOpen(false);
      form.reset();
      setQuery("");
      setEstimatedData(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add meal. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full shadow-lg hover:shadow-xl transition-all gap-2 px-6">
          <Plus className="w-5 h-5" /> Add Meal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">Log Meal</DialogTitle>
          <DialogDescription>
            Add a meal to your diary for {format(date, "MMMM do")}.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="ai" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="ai" className="gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" /> AI Estimate
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <UtensilsIcon className="w-4 h-4" /> Manual Entry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="flex-1 flex flex-col gap-4 overflow-y-auto px-1">
            <div className="space-y-4">
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <Label htmlFor="query" className="text-purple-900 font-medium mb-2 block">
                  What did you eat?
                </Label>
                <div className="flex gap-2">
                  <Textarea
                    id="query"
                    placeholder="e.g., Grilled chicken breast with roasted vegetables and quinoa"
                    className="resize-none bg-white border-purple-200 focus-visible:ring-purple-500 min-h-[80px]"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <div className="mt-3 flex justify-end">
                  <Button 
                    onClick={handleEstimate} 
                    disabled={estimateCalories.isPending || !query.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                  >
                    {estimateCalories.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Analyze
                  </Button>
                </div>
              </div>

              {estimatedData && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="bg-muted/50 p-4 rounded-xl border">
                    <h4 className="font-semibold text-lg mb-3">{estimatedData.name}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-background p-3 rounded-lg border">
                        <span className="text-muted-foreground block">Calories</span>
                        <span className="font-bold text-lg text-primary">{estimatedData.calories}</span>
                      </div>
                      <div className="bg-background p-3 rounded-lg border">
                        <span className="text-muted-foreground block">Protein</span>
                        <span className="font-bold text-lg text-orange-500">{estimatedData.protein}g</span>
                      </div>
                      <div className="bg-background p-3 rounded-lg border">
                        <span className="text-muted-foreground block">Carbs</span>
                        <span className="font-bold text-lg text-yellow-500">{estimatedData.carbs}g</span>
                      </div>
                      <div className="bg-background p-3 rounded-lg border">
                        <span className="text-muted-foreground block">Fats</span>
                        <span className="font-bold text-lg text-purple-500">{estimatedData.fats}g</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full h-12 text-lg font-semibold bg-green-600 hover:bg-green-700"
                    onClick={() => onSubmit(estimatedData)}
                    disabled={createMeal.isPending}
                  >
                    {createMeal.isPending && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                    Add This Meal
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="manual" className="flex-1 overflow-y-auto px-1">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Meal Name</Label>
                <Input id="name" {...form.register("name")} placeholder="e.g., Oatmeal with berries" />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calories">Calories</Label>
                  <Input 
                    id="calories" 
                    type="number" 
                    {...form.register("calories")} 
                    className="border-green-200 focus-visible:ring-green-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input 
                    id="protein" 
                    type="number" 
                    {...form.register("protein")}
                    className="border-orange-200 focus-visible:ring-orange-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carbs">Carbs (g)</Label>
                  <Input 
                    id="carbs" 
                    type="number" 
                    {...form.register("carbs")} 
                    className="border-yellow-200 focus-visible:ring-yellow-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fats">Fats (g)</Label>
                  <Input 
                    id="fats" 
                    type="number" 
                    {...form.register("fats")} 
                    className="border-purple-200 focus-visible:ring-purple-500"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={createMeal.isPending}
                >
                  {createMeal.isPending ? "Adding..." : "Add Meal"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function UtensilsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  )
}
