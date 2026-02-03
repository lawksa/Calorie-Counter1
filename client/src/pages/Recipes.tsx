import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useRecipes, useRecipe } from "@/hooks/use-recipes";
import { useCreateMeal } from "@/hooks/use-meals";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Clock, 
  Flame, 
  Beef, 
  Wheat, 
  Droplets,
  Plus,
  ChevronLeft,
  UtensilsCrossed,
  Coffee,
  Sun,
  Moon,
  Cookie,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Recipe } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const categories = [
  { key: "all", label: "الكل", icon: UtensilsCrossed },
  { key: "breakfast", label: "فطور", icon: Coffee },
  { key: "lunch", label: "غداء", icon: Sun },
  { key: "dinner", label: "عشاء", icon: Moon },
  { key: "snack", label: "سناك", icon: Cookie },
];

export default function Recipes() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const { data: allRecipes, isLoading } = useRecipes();
  const createMeal = useCreateMeal();
  const { toast } = useToast();

  const recipes = selectedCategory === "all" 
    ? allRecipes 
    : allRecipes?.filter(r => r.category === selectedCategory);

  const handleAddMeal = async (recipe: Recipe) => {
    try {
      await createMeal.mutateAsync({
        name: recipe.nameAr,
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fats: recipe.fats,
      });
      toast({
        title: "تمت الإضافة",
        description: `تم إضافة ${recipe.nameAr} إلى وجباتك`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إضافة الوجبة",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">الوصفات الصحية</h1>
          <p className="text-muted-foreground">وصفات لذيذة ومنخفضة السعرات</p>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Button
                key={cat.key}
                variant={selectedCategory === cat.key ? "default" : "outline"}
                size="sm"
                className="rounded-full shrink-0 gap-2"
                onClick={() => setSelectedCategory(cat.key)}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </Button>
            );
          })}
        </div>

        {/* Recipe Grid */}
        <div className="grid gap-4">
          {recipes?.map((recipe, index) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card
                className="p-4 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedRecipe(recipe)}
              >
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/20 to-emerald-500/20 flex items-center justify-center shrink-0">
                    <UtensilsCrossed className="w-8 h-8 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{recipe.nameAr}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{recipe.descriptionAr}</p>
                    
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {recipe.prepTime} دقيقة
                      </span>
                      <span className="flex items-center gap-1 text-primary font-medium">
                        <Flame className="w-3 h-3" />
                        {recipe.calories} سعرة
                      </span>
                    </div>
                  </div>

                  <ChevronLeft className="w-5 h-5 text-muted-foreground self-center shrink-0" />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {recipes?.length === 0 && (
          <div className="text-center py-12">
            <UtensilsCrossed className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">لا توجد وصفات</p>
          </div>
        )}

        {/* Recipe Detail Dialog */}
        <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
          <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-hidden flex flex-col p-0" dir="rtl">
            <DialogHeader className="p-6 pb-4 border-b">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setSelectedRecipe(null)}
                >
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                  <DialogTitle className="text-xl font-bold">{selectedRecipe?.nameAr}</DialogTitle>
                  <p className="text-sm text-muted-foreground">{selectedRecipe?.name}</p>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Nutrition Info */}
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-3 rounded-xl bg-primary/10">
                  <Flame className="w-5 h-5 mx-auto text-primary mb-1" />
                  <p className="text-lg font-bold">{selectedRecipe?.calories}</p>
                  <p className="text-xs text-muted-foreground">سعرة</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                  <Beef className="w-5 h-5 mx-auto text-green-600 mb-1" />
                  <p className="text-lg font-bold">{selectedRecipe?.protein}غ</p>
                  <p className="text-xs text-muted-foreground">بروتين</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                  <Wheat className="w-5 h-5 mx-auto text-orange-600 mb-1" />
                  <p className="text-lg font-bold">{selectedRecipe?.carbs}غ</p>
                  <p className="text-xs text-muted-foreground">كربوهيدرات</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                  <Droplets className="w-5 h-5 mx-auto text-purple-600 mb-1" />
                  <p className="text-lg font-bold">{selectedRecipe?.fats}غ</p>
                  <p className="text-xs text-muted-foreground">دهون</p>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <h4 className="font-bold mb-3">المكونات</h4>
                <ul className="space-y-2">
                  {selectedRecipe?.ingredientsAr?.map((ing, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div>
                <h4 className="font-bold mb-3">طريقة التحضير</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedRecipe?.instructionsAr}
                </p>
              </div>
            </div>

            <div className="p-4 border-t">
              <Button
                className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-emerald-500"
                onClick={() => selectedRecipe && handleAddMeal(selectedRecipe)}
                disabled={createMeal.isPending}
              >
                {createMeal.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 ml-2" />
                    أضف كوجبة
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
