import { useState } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { AppLayout } from "@/components/layout/AppLayout";
import { useExercises, useCreateExercise, useDeleteExercise } from "@/hooks/use-exercises";
import { DateSelector } from "@/components/common/DateSelector";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Loader2, 
  Dumbbell, 
  Plus,
  Trash2,
  Clock,
  Flame,
  Activity,
  Bike,
  PersonStanding,
  Footprints,
  Home,
  Building2,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const exerciseTypes = [
  { value: "cardio", label: "كارديو", icon: Footprints, color: "text-red-500" },
  { value: "strength", label: "قوة", icon: Dumbbell, color: "text-blue-500" },
  { value: "flexibility", label: "مرونة", icon: PersonStanding, color: "text-purple-500" },
  { value: "sports", label: "رياضة", icon: Bike, color: "text-green-500" },
];

// Home exercises - no equipment needed
const homeExercises = [
  { name: "المشي", nameAr: "المشي", type: "cardio", caloriesPerMin: 5 },
  { name: "الجري في المكان", nameAr: "الجري في المكان", type: "cardio", caloriesPerMin: 10 },
  { name: "نط الحبل", nameAr: "نط الحبل", type: "cardio", caloriesPerMin: 12 },
  { name: "تمارين الضغط", nameAr: "تمارين الضغط", type: "strength", caloriesPerMin: 8 },
  { name: "تمارين البطن", nameAr: "تمارين البطن", type: "strength", caloriesPerMin: 6 },
  { name: "السكوات", nameAr: "السكوات", type: "strength", caloriesPerMin: 7 },
  { name: "تمارين البلانك", nameAr: "تمارين البلانك", type: "strength", caloriesPerMin: 5 },
  { name: "اليوغا", nameAr: "اليوغا", type: "flexibility", caloriesPerMin: 4 },
  { name: "تمدد", nameAr: "تمدد", type: "flexibility", caloriesPerMin: 3 },
  { name: "تمارين HIIT", nameAr: "تمارين HIIT", type: "cardio", caloriesPerMin: 14 },
];

// Gym exercises - equipment found in Saudi gyms (Fitness Time, Leejam, Gold's Gym, etc.)
const gymExercises = [
  { name: "جهاز المشي", nameAr: "جهاز المشي (Treadmill)", type: "cardio", caloriesPerMin: 10 },
  { name: "الدراجة الثابتة", nameAr: "الدراجة الثابتة (Stationary Bike)", type: "cardio", caloriesPerMin: 8 },
  { name: "جهاز الإليبتيكال", nameAr: "جهاز الإليبتيكال (Elliptical)", type: "cardio", caloriesPerMin: 9 },
  { name: "جهاز التجديف", nameAr: "جهاز التجديف (Rowing Machine)", type: "cardio", caloriesPerMin: 11 },
  { name: "جهاز الدرج", nameAr: "جهاز الدرج (Stair Climber)", type: "cardio", caloriesPerMin: 12 },
  { name: "بنش الصدر", nameAr: "بنش الصدر (Chest Press)", type: "strength", caloriesPerMin: 6 },
  { name: "جهاز الظهر", nameAr: "جهاز الظهر (Lat Pulldown)", type: "strength", caloriesPerMin: 6 },
  { name: "جهاز الأرجل", nameAr: "جهاز الأرجل (Leg Press)", type: "strength", caloriesPerMin: 7 },
  { name: "جهاز الكتف", nameAr: "جهاز الكتف (Shoulder Press)", type: "strength", caloriesPerMin: 6 },
  { name: "جهاز الباي", nameAr: "جهاز الباي (Bicep Curl Machine)", type: "strength", caloriesPerMin: 5 },
  { name: "جهاز التراي", nameAr: "جهاز التراي (Tricep Machine)", type: "strength", caloriesPerMin: 5 },
  { name: "جهاز البطن", nameAr: "جهاز البطن (Ab Machine)", type: "strength", caloriesPerMin: 5 },
  { name: "الأوزان الحرة", nameAr: "الأوزان الحرة (Free Weights)", type: "strength", caloriesPerMin: 7 },
  { name: "جهاز الكيبل", nameAr: "جهاز الكيبل (Cable Machine)", type: "strength", caloriesPerMin: 6 },
  { name: "جهاز سميث", nameAr: "جهاز سميث (Smith Machine)", type: "strength", caloriesPerMin: 7 },
];

type ExerciseLocation = "home" | "gym" | null;

export default function Exercises() {
  const [date, setDate] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<typeof homeExercises[0] | null>(null);
  const [duration, setDuration] = useState("");
  const [customName, setCustomName] = useState("");
  const [customType, setCustomType] = useState<string>("cardio");
  const [customCalories, setCustomCalories] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [exerciseLocation, setExerciseLocation] = useState<ExerciseLocation>(null);
  
  const { data: exercises, isLoading } = useExercises(date);
  const createExercise = useCreateExercise();
  const deleteExercise = useDeleteExercise();
  const { toast } = useToast();

  const totalCaloriesBurned = exercises?.reduce((sum, e) => sum + e.caloriesBurned, 0) || 0;
  const totalDuration = exercises?.reduce((sum, e) => sum + e.duration, 0) || 0;

  const handleAddExercise = async () => {
    if (isCustom) {
      if (!customName || !duration || !customCalories) {
        toast({ title: "خطأ", description: "أكمل جميع الحقول", variant: "destructive" });
        return;
      }
      await createExercise.mutateAsync({
        name: customName,
        nameAr: customName,
        type: customType,
        duration: parseInt(duration),
        caloriesBurned: parseInt(customCalories),
      });
    } else if (selectedPreset && duration) {
      const caloriesBurned = selectedPreset.caloriesPerMin * parseInt(duration);
      await createExercise.mutateAsync({
        name: selectedPreset.name,
        nameAr: selectedPreset.nameAr,
        type: selectedPreset.type,
        duration: parseInt(duration),
        caloriesBurned,
      });
    } else {
      toast({ title: "خطأ", description: "اختر تمرين ومدة", variant: "destructive" });
      return;
    }

    setDialogOpen(false);
    setSelectedPreset(null);
    setDuration("");
    setCustomName("");
    setCustomCalories("");
    setExerciseLocation(null);
    toast({ title: "تم", description: "تم إضافة التمرين" });
  };

  const handleDelete = async (id: number) => {
    await deleteExercise.mutateAsync(id);
    toast({ title: "تم", description: "تم حذف التمرين" });
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">التمارين</h1>
            <p className="text-muted-foreground">سجل نشاطك الرياضي</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl gap-2">
                <Plus className="w-4 h-4" />
                إضافة
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="sm:max-w-[450px] max-h-[85vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {exerciseLocation && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => {
                        setExerciseLocation(null);
                        setSelectedPreset(null);
                        setIsCustom(false);
                      }}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                  {!exerciseLocation ? "اختر مكان التمرين" : exerciseLocation === "home" ? "تمارين منزلية" : "تمارين النادي"}
                </DialogTitle>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {/* Step 1: Choose Location */}
                  {!exerciseLocation && (
                    <motion.div
                      key="location"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="grid grid-cols-2 gap-4 p-1"
                    >
                      <button
                        onClick={() => setExerciseLocation("home")}
                        className="p-6 rounded-2xl border-2 border-muted hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center gap-4 group"
                        data-testid="button-location-home"
                      >
                        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Home className="w-8 h-8 text-blue-500" />
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-lg">المنزل</p>
                          <p className="text-xs text-muted-foreground">تمارين بدون معدات</p>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => setExerciseLocation("gym")}
                        className="p-6 rounded-2xl border-2 border-muted hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center gap-4 group"
                        data-testid="button-location-gym"
                      >
                        <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Building2 className="w-8 h-8 text-purple-500" />
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-lg">النادي</p>
                          <p className="text-xs text-muted-foreground">أجهزة الجيم</p>
                        </div>
                      </button>
                    </motion.div>
                  )}

                  {/* Step 2: Choose Exercise */}
                  {exerciseLocation && (
                    <motion.div
                      key="exercises"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4 p-1"
                    >
                      <div className="flex gap-2">
                        <Button 
                          variant={!isCustom ? "default" : "outline"}
                          className="flex-1"
                          onClick={() => setIsCustom(false)}
                        >
                          اختر تمرين
                        </Button>
                        <Button 
                          variant={isCustom ? "default" : "outline"}
                          className="flex-1"
                          onClick={() => setIsCustom(true)}
                        >
                          تمرين مخصص
                        </Button>
                      </div>

                      {!isCustom ? (
                        <>
                          <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto">
                            {(exerciseLocation === "home" ? homeExercises : gymExercises).map((preset) => {
                              const typeInfo = exerciseTypes.find(t => t.value === preset.type);
                              const Icon = typeInfo?.icon || Activity;
                              return (
                                <Button
                                  key={preset.name}
                                  variant={selectedPreset?.name === preset.name ? "default" : "outline"}
                                  className="h-auto py-3 flex-col gap-1 text-wrap"
                                  onClick={() => setSelectedPreset(preset)}
                                  data-testid={`button-exercise-${preset.name}`}
                                >
                                  <Icon className={`w-5 h-5 ${typeInfo?.color}`} />
                                  <span className="text-xs leading-tight">{preset.nameAr}</span>
                                </Button>
                              );
                            })}
                          </div>
                          
                          <div>
                            <Label>المدة (دقائق)</Label>
                            <Input
                              type="number"
                              placeholder="30"
                              value={duration}
                              onChange={(e) => setDuration(e.target.value)}
                              className="h-12 text-center"
                              data-testid="input-exercise-duration"
                            />
                            {selectedPreset && duration && (
                              <p className="text-sm text-muted-foreground mt-2 text-center">
                                السعرات المحروقة: <span className="font-bold text-primary">
                                  {selectedPreset.caloriesPerMin * parseInt(duration || "0")}
                                </span>
                              </p>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <Label>اسم التمرين</Label>
                            <Input
                              placeholder="اسم التمرين"
                              value={customName}
                              onChange={(e) => setCustomName(e.target.value)}
                              className="h-12"
                            />
                          </div>
                          <div>
                            <Label>النوع</Label>
                            <Select value={customType} onValueChange={setCustomType}>
                              <SelectTrigger className="h-12">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {exerciseTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>المدة (دقائق)</Label>
                              <Input
                                type="number"
                                placeholder="30"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="h-12 text-center"
                              />
                            </div>
                            <div>
                              <Label>السعرات المحروقة</Label>
                              <Input
                                type="number"
                                placeholder="200"
                                value={customCalories}
                                onChange={(e) => setCustomCalories(e.target.value)}
                                className="h-12 text-center"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      <Button 
                        className="w-full h-12"
                        onClick={handleAddExercise}
                        disabled={createExercise.isPending}
                        data-testid="button-add-exercise"
                      >
                        {createExercise.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "إضافة التمرين"}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <DateSelector date={date} onDateChange={setDate} />

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 border-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">سعرات محروقة</p>
                <p className="text-xl font-bold">{totalCaloriesBurned}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">إجمالي الوقت</p>
                <p className="text-xl font-bold">{totalDuration} دقيقة</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Exercise List */}
        <div className="space-y-3">
          {exercises?.map((exercise, index) => {
            const typeInfo = exerciseTypes.find(t => t.value === exercise.type);
            const Icon = typeInfo?.icon || Activity;
            return (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="p-4 border-0 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${typeInfo?.color}`} />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-bold">{exercise.nameAr || exercise.name}</h3>
                      <div className="flex gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {exercise.duration} دقيقة
                        </span>
                        <span className="flex items-center gap-1 text-orange-500">
                          <Flame className="w-3 h-3" />
                          {exercise.caloriesBurned} سعرة
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDelete(exercise.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {exercises?.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-8"
          >
            <button
              onClick={() => setDialogOpen(true)}
              className="w-full p-6 rounded-2xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-4 group"
              data-testid="add-exercise-empty"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                <Plus className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-bold text-lg mb-1">أضف تمرينك الأول</p>
                <p className="text-muted-foreground text-sm">
                  الحركة بركة! ابدأ يومك بنشاط بدني
                </p>
              </div>
            </button>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
