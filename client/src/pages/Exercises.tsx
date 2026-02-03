import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { AppLayout } from "@/components/layout/AppLayout";
import { useExercises, useCreateExercise, useDeleteExercise } from "@/hooks/use-exercises";
import { DateSelector } from "@/components/common/DateSelector";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkoutPlans } from "@/components/exercises/WorkoutPlans";
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
  ArrowRight,
  Weight,
  Heart,
  Zap,
  Move,
  StretchHorizontal,
  CircleDot,
  Target,
  Grip,
  Square,
  ArrowUpDown,
  RotateCcw,
  Waves,
  Mountain,
  Cable,
  Box,
  Armchair,
  Shield,
  CircleUser,
  Hand,
  Camera,
  ImagePlus,
  X,
  CalendarDays,
  ListChecks,
  Play,
  Pause,
  Timer,
  StopCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

// Import exercise images (illustrations)
import treadmillImg from "@/assets/exercises/treadmill.png";
import bikeImg from "@/assets/exercises/bike.png";
import ellipticalImg from "@/assets/exercises/elliptical.png";
import rowingImg from "@/assets/exercises/rowing.png";
import stairImg from "@/assets/exercises/stair.png";
import benchFlatImg from "@/assets/exercises/bench-flat.png";
import benchInclineImg from "@/assets/exercises/bench-incline.png";
import chestPressImg from "@/assets/exercises/chest-press.png";
import pecDeckImg from "@/assets/exercises/pec-deck.png";
import latPulldownImg from "@/assets/exercises/lat-pulldown.png";
import seatedRowImg from "@/assets/exercises/seated-row.png";
import shoulderPressImg from "@/assets/exercises/shoulder-press.png";
import bicepCurlImg from "@/assets/exercises/bicep-curl.png";
import tricepPushdownImg from "@/assets/exercises/tricep-pushdown.png";
import legPressImg from "@/assets/exercises/leg-press.png";
import squatRackImg from "@/assets/exercises/squat-rack.png";
import legExtensionImg from "@/assets/exercises/leg-extension.png";
import legCurlImg from "@/assets/exercises/leg-curl.png";
import cableMachineImg from "@/assets/exercises/cable-machine.png";
import smithMachineImg from "@/assets/exercises/smith-machine.png";
import dumbbellsImg from "@/assets/exercises/dumbbells.png";
import kettlebellImg from "@/assets/exercises/kettlebell.png";
import hackSquatImg from "@/assets/exercises/hack-squat.png";
import abMachineImg from "@/assets/exercises/ab-machine.png";
import calfRaiseImg from "@/assets/exercises/calf-raise.png";
import walkingImg from "@/assets/exercises/walking.png";
import pushupImg from "@/assets/exercises/pushup.png";
import plankImg from "@/assets/exercises/plank.png";
import squatImg from "@/assets/exercises/squat.png";
import yogaImg from "@/assets/exercises/yoga.png";
import jumpRopeImg from "@/assets/exercises/jump-rope.png";
import burpeeImg from "@/assets/exercises/burpee.png";
import lungeImg from "@/assets/exercises/lunge.png";
import runningImg from "@/assets/exercises/running.png";
import crunchesImg from "@/assets/exercises/crunches.png";
import stretchingImg from "@/assets/exercises/stretching.png";
import hiitImg from "@/assets/exercises/hiit.png";
import tBarImg from "@/assets/exercises/t-bar.png";
import lateralRaiseImg from "@/assets/exercises/lateral-raise.png";
import dumbbellCurlImg from "@/assets/exercises/dumbbell-curl.png";
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
  { name: "المشي", nameAr: "المشي", type: "cardio", caloriesPerMin: 5, icon: Footprints, color: "text-green-500", needsWeight: false, image: walkingImg },
  { name: "الجري في المكان", nameAr: "الجري في المكان", type: "cardio", caloriesPerMin: 10, icon: Zap, color: "text-orange-500", needsWeight: false, image: runningImg },
  { name: "نط الحبل", nameAr: "نط الحبل", type: "cardio", caloriesPerMin: 12, icon: RotateCcw, color: "text-pink-500", needsWeight: false, image: jumpRopeImg },
  { name: "تمارين الضغط", nameAr: "تمارين الضغط", type: "strength", caloriesPerMin: 8, icon: ArrowUpDown, color: "text-blue-500", needsWeight: false, image: pushupImg },
  { name: "تمارين البطن", nameAr: "تمارين البطن", type: "strength", caloriesPerMin: 6, icon: CircleDot, color: "text-amber-500", needsWeight: false, image: crunchesImg },
  { name: "السكوات", nameAr: "السكوات", type: "strength", caloriesPerMin: 7, icon: PersonStanding, color: "text-indigo-500", needsWeight: false, image: squatImg },
  { name: "تمارين البلانك", nameAr: "تمارين البلانك", type: "strength", caloriesPerMin: 5, icon: StretchHorizontal, color: "text-cyan-500", needsWeight: false, image: plankImg },
  { name: "اليوغا", nameAr: "اليوغا", type: "flexibility", caloriesPerMin: 4, icon: Heart, color: "text-purple-500", needsWeight: false, image: yogaImg },
  { name: "تمدد", nameAr: "تمدد", type: "flexibility", caloriesPerMin: 3, icon: Move, color: "text-teal-500", needsWeight: false, image: stretchingImg },
  { name: "تمارين HIIT", nameAr: "تمارين HIIT", type: "cardio", caloriesPerMin: 14, icon: Flame, color: "text-red-500", needsWeight: false, image: hiitImg },
  { name: "بيربي", nameAr: "بيربي (Burpees)", type: "cardio", caloriesPerMin: 12, icon: Zap, color: "text-rose-500", needsWeight: false, image: burpeeImg },
  { name: "لانجز", nameAr: "لانجز (Lunges)", type: "strength", caloriesPerMin: 6, icon: Footprints, color: "text-violet-500", needsWeight: false, image: lungeImg },
];

// Gym exercises - equipment found in Saudi gyms (Fitness Time, Leejam, Gold's Gym, etc.)
const gymExercises = [
  // Cardio Equipment
  { name: "جهاز المشي", nameAr: "جهاز المشي", type: "cardio", caloriesPerMin: 10, icon: Activity, color: "text-green-500", needsWeight: false, image: treadmillImg },
  { name: "الدراجة الثابتة", nameAr: "الدراجة الثابتة", type: "cardio", caloriesPerMin: 8, icon: Bike, color: "text-blue-500", needsWeight: false, image: bikeImg },
  { name: "جهاز الإليبتيكال", nameAr: "الإليبتيكال", type: "cardio", caloriesPerMin: 9, icon: Waves, color: "text-cyan-500", needsWeight: false, image: ellipticalImg },
  { name: "جهاز التجديف", nameAr: "جهاز التجديف", type: "cardio", caloriesPerMin: 11, icon: Waves, color: "text-teal-500", needsWeight: false, image: rowingImg },
  { name: "جهاز الدرج", nameAr: "جهاز الدرج", type: "cardio", caloriesPerMin: 12, icon: Mountain, color: "text-orange-500", needsWeight: false, image: stairImg },
  
  // Chest
  { name: "بنش مسطح", nameAr: "بنش مسطح", type: "strength", caloriesPerMin: 6, icon: Square, color: "text-red-500", needsWeight: true, image: benchFlatImg },
  { name: "بنش مائل علوي", nameAr: "بنش مائل علوي", type: "strength", caloriesPerMin: 6, icon: Square, color: "text-red-400", needsWeight: true, image: benchInclineImg },
  { name: "بنش مائل سفلي", nameAr: "بنش مائل سفلي", type: "strength", caloriesPerMin: 6, icon: Square, color: "text-red-600", needsWeight: true, image: benchInclineImg },
  { name: "جهاز الصدر", nameAr: "جهاز الصدر (Chest Press)", type: "strength", caloriesPerMin: 6, icon: Target, color: "text-rose-500", needsWeight: true, image: chestPressImg },
  { name: "تفتيح صدر", nameAr: "تفتيح صدر (Pec Deck)", type: "strength", caloriesPerMin: 5, icon: Move, color: "text-pink-500", needsWeight: true, image: pecDeckImg },
  
  // Back
  { name: "سحب أمامي", nameAr: "سحب أمامي (Lat Pulldown)", type: "strength", caloriesPerMin: 6, icon: ArrowUpDown, color: "text-blue-500", needsWeight: true, image: latPulldownImg },
  { name: "سحب أرضي", nameAr: "سحب أرضي (Seated Row)", type: "strength", caloriesPerMin: 6, icon: Grip, color: "text-blue-600", needsWeight: true, image: seatedRowImg },
  { name: "تي بار", nameAr: "تي بار (T-Bar Row)", type: "strength", caloriesPerMin: 7, icon: Dumbbell, color: "text-indigo-500", needsWeight: true, image: tBarImg },
  
  // Shoulders
  { name: "كتف أمامي", nameAr: "كتف أمامي (Front Raise)", type: "strength", caloriesPerMin: 5, icon: CircleUser, color: "text-amber-500", needsWeight: true, image: lateralRaiseImg },
  { name: "كتف جانبي", nameAr: "كتف جانبي (Lateral Raise)", type: "strength", caloriesPerMin: 5, icon: Move, color: "text-yellow-500", needsWeight: true, image: lateralRaiseImg },
  { name: "شولدر برس", nameAr: "شولدر برس (Shoulder Press)", type: "strength", caloriesPerMin: 6, icon: ArrowUpDown, color: "text-orange-500", needsWeight: true, image: shoulderPressImg },
  
  // Arms
  { name: "باي بار", nameAr: "باي بار (Barbell Curl)", type: "strength", caloriesPerMin: 5, icon: Dumbbell, color: "text-purple-500", needsWeight: true, image: bicepCurlImg },
  { name: "باي دمبل", nameAr: "باي دمبل (Dumbbell Curl)", type: "strength", caloriesPerMin: 5, icon: Weight, color: "text-violet-500", needsWeight: true, image: dumbbellCurlImg },
  { name: "تراي كيبل", nameAr: "تراي كيبل (Tricep Pushdown)", type: "strength", caloriesPerMin: 5, icon: Cable, color: "text-fuchsia-500", needsWeight: true, image: tricepPushdownImg },
  { name: "تراي سكل كراشر", nameAr: "سكل كراشر (Skull Crusher)", type: "strength", caloriesPerMin: 5, icon: Dumbbell, color: "text-pink-600", needsWeight: true, image: dumbbellsImg },
  
  // Legs
  { name: "ليج برس", nameAr: "ليج برس (Leg Press)", type: "strength", caloriesPerMin: 8, icon: Box, color: "text-emerald-500", needsWeight: true, image: legPressImg },
  { name: "سكوات راك", nameAr: "سكوات راك (Squat Rack)", type: "strength", caloriesPerMin: 9, icon: PersonStanding, color: "text-green-600", needsWeight: true, image: squatRackImg },
  { name: "ليج اكستنشن", nameAr: "ليج اكستنشن (Leg Extension)", type: "strength", caloriesPerMin: 6, icon: Footprints, color: "text-lime-500", needsWeight: true, image: legExtensionImg },
  { name: "ليج كيرل", nameAr: "ليج كيرل (Leg Curl)", type: "strength", caloriesPerMin: 6, icon: RotateCcw, color: "text-teal-500", needsWeight: true, image: legCurlImg },
  { name: "كاف ريز", nameAr: "كاف ريز (Calf Raise)", type: "strength", caloriesPerMin: 5, icon: ArrowUpDown, color: "text-cyan-600", needsWeight: true, image: calfRaiseImg },
  { name: "هاك سكوات", nameAr: "هاك سكوات (Hack Squat)", type: "strength", caloriesPerMin: 8, icon: Shield, color: "text-green-500", needsWeight: true, image: hackSquatImg },
  
  // Core
  { name: "جهاز البطن", nameAr: "جهاز البطن (Ab Machine)", type: "strength", caloriesPerMin: 5, icon: CircleDot, color: "text-amber-500", needsWeight: true, image: abMachineImg },
  { name: "كيبل كرنش", nameAr: "كيبل كرنش (Cable Crunch)", type: "strength", caloriesPerMin: 5, icon: Cable, color: "text-orange-400", needsWeight: true, image: cableMachineImg },
  
  // Multi-purpose
  { name: "جهاز الكيبل", nameAr: "جهاز الكيبل (Cable Machine)", type: "strength", caloriesPerMin: 6, icon: Cable, color: "text-slate-500", needsWeight: true, image: cableMachineImg },
  { name: "جهاز سميث", nameAr: "جهاز سميث (Smith Machine)", type: "strength", caloriesPerMin: 7, icon: Grip, color: "text-gray-600", needsWeight: true, image: smithMachineImg },
  { name: "الأوزان الحرة", nameAr: "الأوزان الحرة (Free Weights)", type: "strength", caloriesPerMin: 7, icon: Dumbbell, color: "text-zinc-500", needsWeight: true, image: dumbbellsImg },
  { name: "الكيتل بيل", nameAr: "كيتل بيل (Kettlebell)", type: "strength", caloriesPerMin: 8, icon: Weight, color: "text-stone-500", needsWeight: true, image: kettlebellImg },
];

type ExerciseLocation = "home" | "gym" | null;

type ExercisePreset = {
  name: string;
  nameAr: string;
  type: string;
  caloriesPerMin: number;
  icon: any;
  color: string;
  needsWeight: boolean;
  image: string;
};

export default function Exercises() {
  const [date, setDate] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<ExercisePreset | null>(null);
  const [duration, setDuration] = useState("");
  const [weight, setWeight] = useState("");
  const [customName, setCustomName] = useState("");
  const [customType, setCustomType] = useState<string>("cardio");
  const [customCalories, setCustomCalories] = useState("");
  const [customWeight, setCustomWeight] = useState("");
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [exerciseLocation, setExerciseLocation] = useState<ExerciseLocation>(null);
  
  // Timer state
  const [isTimerMode, setIsTimerMode] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerStopped, setIsTimerStopped] = useState(false);
  const [timerCaloriesInput, setTimerCaloriesInput] = useState("");
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Timer effect
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning]);

  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate real-time calories
  const timerCalories = selectedPreset ? Math.floor((timerSeconds / 60) * selectedPreset.caloriesPerMin) : 0;
  const timerMinutes = Math.ceil(timerSeconds / 60);

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const { data: exercises, isLoading } = useExercises(date);
  const createExercise = useCreateExercise();
  const deleteExercise = useDeleteExercise();
  const { toast } = useToast();

  const totalCaloriesBurned = exercises?.reduce((sum, e) => sum + e.caloriesBurned, 0) || 0;
  const totalDuration = exercises?.reduce((sum, e) => sum + e.duration, 0) || 0;

  // Start timer
  const handleStartTimer = () => {
    if (!selectedPreset) {
      toast({ title: "خطأ", description: "اختر تمرين أولاً", variant: "destructive" });
      return;
    }
    setIsTimerMode(true);
    setIsTimerRunning(true);
    setTimerSeconds(0);
  };

  // Stop timer - show calorie input
  const handleStopTimer = () => {
    setIsTimerRunning(false);
    setIsTimerStopped(true);
  };

  // Save exercise after user enters calories
  const handleSaveTimerExercise = async () => {
    if (!timerCaloriesInput || parseInt(timerCaloriesInput) <= 0) {
      toast({ title: "خطأ", description: "أدخل السعرات المحروقة", variant: "destructive" });
      return;
    }
    
    if (selectedPreset && timerSeconds > 0) {
      const finalMinutes = Math.max(1, Math.ceil(timerSeconds / 60));
      
      await createExercise.mutateAsync({
        name: selectedPreset.name,
        nameAr: selectedPreset.nameAr,
        type: selectedPreset.type,
        duration: finalMinutes,
        caloriesBurned: parseInt(timerCaloriesInput),
      });
      
      resetDialog();
      toast({ title: "تم", description: `تم إضافة التمرين - ${finalMinutes} دقيقة` });
    }
  };

  // Reset all dialog state
  const resetDialog = () => {
    setDialogOpen(false);
    setSelectedPreset(null);
    setDuration("");
    setWeight("");
    setCustomName("");
    setCustomCalories("");
    setCustomWeight("");
    setCustomImage(null);
    setExerciseLocation(null);
    setIsTimerMode(false);
    setIsTimerRunning(false);
    setTimerSeconds(0);
    setIsTimerStopped(false);
    setTimerCaloriesInput("");
  };

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

    resetDialog();
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
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">التمارين</h1>
          <p className="text-muted-foreground text-sm">سجل نشاطك الرياضي واختر خطة تمارينك</p>
        </div>

        {/* Tabs for switching between exercises and workout plans */}
        <Tabs defaultValue="exercises" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl">
            <TabsTrigger value="exercises" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-exercises">
              <CalendarDays className="w-4 h-4" />
              تمارين اليوم
            </TabsTrigger>
            <TabsTrigger value="plans" className="rounded-lg gap-2 data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-plans">
              <ListChecks className="w-4 h-4" />
              خطط التمارين
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exercises" className="mt-4 space-y-6">
            {/* Date and Add Button */}
            <div className="flex items-center justify-between gap-2">
              <DateSelector date={date} onDateChange={setDate} />
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl gap-2" data-testid="button-add-exercise">
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
                          <div className="grid grid-cols-2 gap-3 max-h-[280px] overflow-y-auto p-1">
                            {(exerciseLocation === "home" ? homeExercises : gymExercises).map((preset) => {
                              const isSelected = selectedPreset?.name === preset.name;
                              return (
                                <button
                                  key={preset.name}
                                  onClick={() => {
                                    setSelectedPreset(preset);
                                    if (!preset.needsWeight) setWeight("");
                                  }}
                                  className={`relative overflow-hidden rounded-xl transition-all ${
                                    isSelected 
                                      ? "ring-2 ring-primary ring-offset-2 scale-[1.02]" 
                                      : "hover:scale-[1.02]"
                                  }`}
                                  data-testid={`exercise-card-${homeExercises.indexOf(preset) !== -1 ? homeExercises.indexOf(preset) : gymExercises.indexOf(preset)}`}
                                >
                                  <div className="aspect-[4/3] relative">
                                    <img 
                                      src={preset.image} 
                                      alt={preset.nameAr}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 p-2 text-white text-right">
                                      <p className="text-xs font-bold leading-tight line-clamp-2">{preset.nameAr}</p>
                                      <p className="text-[10px] opacity-80">{preset.caloriesPerMin} سعرة/دقيقة</p>
                                    </div>
                                    {isSelected && (
                                      <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          
                          {/* Weight field - only for strength exercises that need it */}
                          {selectedPreset?.needsWeight && (
                            <div className="bg-muted/50 p-3 rounded-xl">
                              <Label className="flex items-center gap-2 text-sm font-medium mb-2">
                                <Weight className="w-4 h-4 text-blue-500" />
                                الوزن (كجم)
                              </Label>
                              <Input
                                type="number"
                                placeholder="مثال: 20"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                className="h-11 text-center"
                                data-testid="input-exercise-weight"
                              />
                            </div>
                          )}

                          {/* Timer Mode Toggle */}
                          {selectedPreset && !isTimerMode && (
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                className="flex-1 h-12 gap-2"
                                onClick={handleStartTimer}
                                data-testid="button-start-timer"
                              >
                                <Play className="w-5 h-5 text-green-500" />
                                ابدأ التمرين
                              </Button>
                            </div>
                          )}

                          {/* Active Timer Display */}
                          {isTimerMode && !isTimerStopped && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-gradient-to-br from-primary/10 to-emerald-500/10 p-4 rounded-xl space-y-4"
                            >
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">
                                  {selectedPreset?.nameAr}
                                </p>
                                <div className="flex items-center justify-center gap-2 text-4xl font-mono font-bold">
                                  <Timer className={`w-8 h-8 text-primary ${isTimerRunning ? "animate-pulse" : ""}`} />
                                  <span>{formatTime(timerSeconds)}</span>
                                </div>
                              </div>
                              
                              <div className="bg-background/50 rounded-lg p-3 text-center">
                                <p className="text-xs text-muted-foreground">المدة</p>
                                <p className="font-bold text-lg">{timerMinutes} دقيقة</p>
                              </div>

                              {isTimerRunning ? (
                                <Button
                                  type="button"
                                  variant="destructive"
                                  className="w-full h-12 gap-2"
                                  onClick={handleStopTimer}
                                  data-testid="button-stop-timer"
                                >
                                  <StopCircle className="w-5 h-5" />
                                  إيقاف التمرين
                                </Button>
                              ) : (
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    className="flex-1 h-12 gap-2"
                                    onClick={() => setIsTimerRunning(true)}
                                    data-testid="button-resume-timer"
                                  >
                                    <Play className="w-5 h-5" />
                                    استمرار
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 h-12 gap-2"
                                    onClick={handleStopTimer}
                                    data-testid="button-finish-timer"
                                  >
                                    انتهيت
                                  </Button>
                                </div>
                              )}
                            </motion.div>
                          )}

                          {/* Calorie Input After Timer Stops */}
                          {isTimerMode && isTimerStopped && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-gradient-to-br from-orange-500/10 to-red-500/10 p-4 rounded-xl space-y-4"
                            >
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">
                                  {selectedPreset?.nameAr}
                                </p>
                                <p className="text-2xl font-bold">{timerMinutes} دقيقة</p>
                              </div>
                              
                              <div>
                                <Label className="flex items-center gap-2 text-sm font-medium mb-2">
                                  <Flame className="w-4 h-4 text-orange-500" />
                                  أدخل السعرات المحروقة
                                </Label>
                                <Input
                                  type="number"
                                  placeholder="مثال: 150"
                                  value={timerCaloriesInput}
                                  onChange={(e) => setTimerCaloriesInput(e.target.value)}
                                  className="h-12 text-center text-lg"
                                  data-testid="input-timer-calories"
                                  autoFocus
                                />
                              </div>

                              <Button
                                type="button"
                                className="w-full h-12 gap-2"
                                onClick={handleSaveTimerExercise}
                                disabled={createExercise.isPending}
                                data-testid="button-save-timer-exercise"
                              >
                                {createExercise.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "حفظ التمرين"}
                              </Button>
                            </motion.div>
                          )}

                          {/* Manual Duration Input - Only show when timer is not active */}
                          {!isTimerMode && (
                            <div className="pt-2 border-t">
                              <p className="text-xs text-muted-foreground text-center mb-2">أو أدخل المدة يدوياً</p>
                              <div>
                                <Label className="flex items-center gap-2 text-sm font-medium mb-2">
                                  <Clock className="w-4 h-4 text-orange-500" />
                                  المدة (دقائق)
                                </Label>
                                <Input
                                  type="number"
                                  placeholder="30"
                                  value={duration}
                                  onChange={(e) => setDuration(e.target.value)}
                                  className="h-11 text-center"
                                  data-testid="input-exercise-duration"
                                />
                              </div>
                            </div>
                          )}
                          
                          {selectedPreset && duration && !isTimerMode && (
                            <p className="text-sm text-muted-foreground text-center">
                              السعرات المحروقة: <span className="font-bold text-primary">
                                {selectedPreset.caloriesPerMin * parseInt(duration || "0")}
                              </span>
                              {weight && (
                                <span className="text-muted-foreground"> | الوزن: {weight} كجم</span>
                              )}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Image Capture */}
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Camera className="w-4 h-4 text-primary" />
                              صورة الجهاز (اختياري)
                            </Label>
                            {customImage ? (
                              <div className="relative">
                                <img 
                                  src={customImage} 
                                  alt="صورة الجهاز" 
                                  className="w-full h-32 object-cover rounded-xl"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 left-2 w-8 h-8 rounded-full"
                                  onClick={() => setCustomImage(null)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                                  <Camera className="w-6 h-6 text-muted-foreground mb-1" />
                                  <span className="text-xs text-muted-foreground">التقط صورة</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={handleImageCapture}
                                    data-testid="input-camera-capture"
                                  />
                                </label>
                                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                                  <ImagePlus className="w-6 h-6 text-muted-foreground mb-1" />
                                  <span className="text-xs text-muted-foreground">اختر من المعرض</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageCapture}
                                    data-testid="input-image-gallery"
                                  />
                                </label>
                              </div>
                            )}
                          </div>

                          <div>
                            <Label>اسم الجهاز / التمرين</Label>
                            <Input
                              placeholder="مثال: جهاز سحب أمامي"
                              value={customName}
                              onChange={(e) => setCustomName(e.target.value)}
                              className="h-12"
                              data-testid="input-custom-exercise-name"
                            />
                          </div>
                          <div>
                            <Label>النوع</Label>
                            <Select value={customType} onValueChange={setCustomType}>
                              <SelectTrigger className="h-12" data-testid="select-custom-type">
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
                          
                          {/* Weight field for custom exercises */}
                          <div className="bg-muted/50 p-3 rounded-xl">
                            <Label className="flex items-center gap-2 text-sm font-medium mb-2">
                              <Weight className="w-4 h-4 text-blue-500" />
                              الوزن (كجم) - اختياري
                            </Label>
                            <Input
                              type="number"
                              placeholder="مثال: 20"
                              value={customWeight}
                              onChange={(e) => setCustomWeight(e.target.value)}
                              className="h-11 text-center"
                              data-testid="input-custom-weight"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-orange-500" />
                                المدة (دقائق)
                              </Label>
                              <Input
                                type="number"
                                placeholder="30"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="h-12 text-center"
                                data-testid="input-custom-duration"
                              />
                            </div>
                            <div>
                              <Label className="flex items-center gap-2">
                                <Flame className="w-4 h-4 text-red-500" />
                                السعرات المحروقة
                              </Label>
                              <Input
                                type="number"
                                placeholder="200"
                                value={customCalories}
                                onChange={(e) => setCustomCalories(e.target.value)}
                                className="h-12 text-center"
                                data-testid="input-custom-calories"
                              />
                            </div>
                          </div>

                          {/* Preview */}
                          {customName && duration && customCalories && (
                            <div className="bg-gradient-to-br from-primary/10 to-emerald-500/10 p-3 rounded-xl">
                              <p className="text-sm text-center text-muted-foreground">
                                <span className="font-bold text-foreground">{customName}</span>
                                {customWeight && <span> | {customWeight} كجم</span>}
                                <span> | {duration} دقيقة</span>
                                <span className="text-primary font-bold"> | {customCalories} سعرة</span>
                              </p>
                            </div>
                          )}
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
            </TabsContent>

          {/* Workout Plans Tab */}
          <TabsContent value="plans" className="mt-4">
            <WorkoutPlans />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
