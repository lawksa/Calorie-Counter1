import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useRestaurants, useRestaurantMenu } from "@/hooks/use-restaurants";
import { useCreateMeal } from "@/hooks/use-meals";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Search, 
  ArrowRight, 
  Plus, 
  Flame,
  Beef,
  Wheat,
  Droplets,
  UtensilsCrossed,
  Coffee,
  Salad,
  ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Restaurant, MenuItem } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const categoryIcons: Record<string, any> = {
  fast_food: UtensilsCrossed,
  saudi: Flame,
  coffee: Coffee,
  healthy: Salad,
};

const categoryLabels: Record<string, string> = {
  fast_food: "وجبات سريعة",
  saudi: "مطاعم سعودية",
  coffee: "مقاهي",
  healthy: "أكل صحي",
};

const menuCategoryLabels: Record<string, string> = {
  main: "الأطباق الرئيسية",
  sides: "الإضافات",
  drinks: "المشروبات",
  desserts: "الحلويات",
};

export default function Restaurants() {
  const [search, setSearch] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { data: restaurants, isLoading } = useRestaurants();
  const { data: menu, isLoading: menuLoading } = useRestaurantMenu(selectedRestaurant?.id || null);
  const createMeal = useCreateMeal();
  const { toast } = useToast();

  const filteredRestaurants = restaurants?.filter(r => 
    r.nameAr.includes(search) || r.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const categories = [...new Set(restaurants?.map(r => r.category) || [])];

  const displayedRestaurants = selectedCategory 
    ? filteredRestaurants.filter(r => r.category === selectedCategory)
    : filteredRestaurants;

  const handleAddMeal = async (item: MenuItem) => {
    try {
      await createMeal.mutateAsync({
        name: item.nameAr,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fats: item.fats,
      });
      toast({
        title: "تمت الإضافة",
        description: `تم إضافة ${item.nameAr} إلى وجباتك`,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إضافة الوجبة",
        variant: "destructive",
      });
    }
  };

  // Group menu items by category
  const groupedMenu = menu?.reduce((acc, item) => {
    const cat = item.category || 'main';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>) || {};

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
          <h1 className="text-2xl font-bold">مطاعم السعودية</h1>
          <p className="text-muted-foreground">اختر من قوائم المطاعم المفضلة</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="ابحث عن مطعم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 h-12 rounded-xl"
            data-testid="search-restaurants"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            className="rounded-full shrink-0"
            onClick={() => setSelectedCategory(null)}
          >
            الكل
          </Button>
          {categories.map((cat) => {
            const Icon = categoryIcons[cat] || UtensilsCrossed;
            return (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                className="rounded-full shrink-0 gap-2"
                onClick={() => setSelectedCategory(cat)}
              >
                <Icon className="w-4 h-4" />
                {categoryLabels[cat] || cat}
              </Button>
            );
          })}
        </div>

        {/* Restaurant List */}
        <div className="grid gap-3">
          {displayedRestaurants.map((restaurant, index) => {
            const Icon = categoryIcons[restaurant.category] || UtensilsCrossed;
            return (
              <motion.div
                key={restaurant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card
                  className="p-4 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedRestaurant(restaurant)}
                  data-testid={`restaurant-${restaurant.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg",
                      restaurant.category === 'fast_food' && "bg-gradient-to-br from-orange-500 to-red-500",
                      restaurant.category === 'saudi' && "bg-gradient-to-br from-amber-500 to-orange-500",
                      restaurant.category === 'coffee' && "bg-gradient-to-br from-amber-700 to-amber-900",
                      restaurant.category === 'healthy' && "bg-gradient-to-br from-green-500 to-emerald-500",
                    )}>
                      <Icon className="w-7 h-7" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{restaurant.nameAr}</h3>
                      <p className="text-sm text-muted-foreground">{restaurant.name}</p>
                    </div>
                    
                    <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {displayedRestaurants.length === 0 && (
          <div className="text-center py-12">
            <UtensilsCrossed className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">لم يتم العثور على مطاعم</p>
          </div>
        )}

        {/* Restaurant Menu Dialog */}
        <Dialog open={!!selectedRestaurant} onOpenChange={() => setSelectedRestaurant(null)}>
          <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-hidden flex flex-col p-0" dir="rtl">
            <DialogHeader className="p-6 pb-4 border-b">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setSelectedRestaurant(null)}
                >
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <div>
                  <DialogTitle className="text-xl font-bold">{selectedRestaurant?.nameAr}</DialogTitle>
                  <p className="text-sm text-muted-foreground">{selectedRestaurant?.name}</p>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-4">
              {menuLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedMenu).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="font-bold text-lg mb-3 text-primary">
                        {menuCategoryLabels[category] || category}
                      </h3>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <Card
                            key={item.id}
                            className="p-4 border-0 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h4 className="font-bold">{item.nameAr}</h4>
                                <p className="text-xs text-muted-foreground mb-2">{item.name}</p>
                                
                                <div className="flex flex-wrap gap-2 text-xs">
                                  <span className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full">
                                    <Flame className="w-3 h-3" />
                                    {item.calories} سعرة
                                  </span>
                                  <span className="flex items-center gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">
                                    <Beef className="w-3 h-3" />
                                    {item.protein}غ
                                  </span>
                                  <span className="flex items-center gap-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-1 rounded-full">
                                    <Wheat className="w-3 h-3" />
                                    {item.carbs}غ
                                  </span>
                                  <span className="flex items-center gap-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-1 rounded-full">
                                    <Droplets className="w-3 h-3" />
                                    {item.fats}غ
                                  </span>
                                </div>
                              </div>
                              
                              <Button
                                size="icon"
                                className="shrink-0 rounded-xl bg-gradient-to-r from-primary to-emerald-500"
                                onClick={() => handleAddMeal(item)}
                                disabled={createMeal.isPending}
                                data-testid={`add-menu-item-${item.id}`}
                              >
                                {createMeal.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Plus className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
