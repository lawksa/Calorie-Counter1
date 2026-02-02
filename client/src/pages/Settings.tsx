import { AppLayout } from "@/components/layout/AppLayout";
import { useGoals, useUpdateGoals } from "@/hooks/use-goals";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertGoalSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Save, Target, LogOut, User, Flame, Beef, Wheat, Droplets, GlassWater } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { motion } from "framer-motion";

const formSchema = insertGoalSchema.extend({
  calories: z.coerce.number().min(100),
  protein: z.coerce.number().min(0),
  carbs: z.coerce.number().min(0),
  fats: z.coerce.number().min(0),
});

type FormValues = z.infer<typeof formSchema>;

export default function Settings() {
  const { data: goals, isLoading } = useGoals();
  const { user, logout } = useAuth();
  const updateGoals = useUpdateGoals();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      calories: 2000,
      protein: 150,
      carbs: 200,
      fats: 65,
      waterGlasses: 8,
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
        title: "تم الحفظ",
        description: "تم تحديث أهدافك الغذائية بنجاح.",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث الأهداف.",
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
        <h1 className="text-2xl font-bold">الإعدادات</h1>

        {/* User Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="p-5 border-0 shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center overflow-hidden">
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{user?.firstName || "مستخدم"} {user?.lastName || ""}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            
            <Button 
              variant="outline"
              className="w-full mt-4 h-12 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => logout()}
            >
              <LogOut className="w-5 h-5 ml-2" />
              تسجيل الخروج
            </Button>
          </Card>
        </motion.div>

        {/* Goals Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="p-5 border-0 shadow-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">الأهداف اليومية</h3>
                <p className="text-sm text-muted-foreground">حدد أهدافك من السعرات والعناصر الغذائية</p>
              </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Calories */}
              <div className="space-y-2">
                <Label htmlFor="calories" className="flex items-center gap-2 font-bold">
                  <Flame className="w-4 h-4 text-primary" />
                  السعرات الحرارية اليومية
                </Label>
                <div className="relative">
                  <Input 
                    id="calories" 
                    type="number" 
                    {...form.register("calories")} 
                    className="h-14 text-2xl font-bold text-center rounded-xl border-primary/30 focus-visible:ring-primary"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    سعرة
                  </div>
                </div>
              </div>

              {/* Macros Grid */}
              <div className="grid grid-cols-3 gap-3 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="protein" className="flex items-center gap-1 text-sm font-medium" style={{ color: "hsl(142 71% 45%)" }}>
                    <Beef className="w-4 h-4" />
                    بروتين
                  </Label>
                  <Input 
                    id="protein" 
                    type="number" 
                    {...form.register("protein")}
                    className="h-12 text-center rounded-xl font-bold"
                    style={{ borderColor: "hsl(142 71% 45% / 0.3)" }}
                  />
                  <p className="text-xs text-center text-muted-foreground">غرام</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carbs" className="flex items-center gap-1 text-sm font-medium" style={{ color: "hsl(25 95% 53%)" }}>
                    <Wheat className="w-4 h-4" />
                    كربوهيدرات
                  </Label>
                  <Input 
                    id="carbs" 
                    type="number" 
                    {...form.register("carbs")} 
                    className="h-12 text-center rounded-xl font-bold"
                    style={{ borderColor: "hsl(25 95% 53% / 0.3)" }}
                  />
                  <p className="text-xs text-center text-muted-foreground">غرام</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fats" className="flex items-center gap-1 text-sm font-medium" style={{ color: "hsl(271 81% 56%)" }}>
                    <Droplets className="w-4 h-4" />
                    دهون
                  </Label>
                  <Input 
                    id="fats" 
                    type="number" 
                    {...form.register("fats")} 
                    className="h-12 text-center rounded-xl font-bold"
                    style={{ borderColor: "hsl(271 81% 56% / 0.3)" }}
                  />
                  <p className="text-xs text-center text-muted-foreground">غرام</p>
                </div>
              </div>

              {/* Water Goal */}
              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="waterGlasses" className="flex items-center gap-2 font-bold text-blue-500">
                  <GlassWater className="w-4 h-4" />
                  هدف الماء اليومي
                </Label>
                <div className="relative">
                  <Input 
                    id="waterGlasses" 
                    type="number" 
                    {...form.register("waterGlasses")} 
                    className="h-12 text-center rounded-xl font-bold border-blue-200 focus-visible:ring-blue-500"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    أكواب
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-emerald-500 rounded-2xl shadow-lg mt-6"
                disabled={updateGoals.isPending}
              >
                {updateGoals.isPending ? (
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                ) : (
                  <Save className="w-5 h-5 ml-2" />
                )}
                حفظ التغييرات
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}
