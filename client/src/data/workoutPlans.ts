// JEFIT-inspired workout plans for Saudi users
// Organized by goal: cutting, bulking, maintenance

export interface WorkoutExercise {
  name: string;
  nameAr: string;
  sets: number;
  reps: string; // Can be "12" or "8-12" or "30 sec"
  restSeconds: number;
  muscleGroup: string;
  tips?: string;
}

export interface WorkoutDay {
  dayNumber: number;
  name: string;
  nameAr: string;
  focus: string;
  focusAr: string;
  exercises: WorkoutExercise[];
  estimatedDuration: number; // minutes
  estimatedCalories: number;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  nameAr: string;
  goal: "cut" | "bulk" | "maintain" | "strength" | "endurance";
  goalAr: string;
  level: "beginner" | "intermediate" | "advanced";
  levelAr: string;
  daysPerWeek: number;
  description: string;
  descriptionAr: string;
  days: WorkoutDay[];
  color: string;
  icon: string;
}

export const muscleGroups = [
  { id: "chest", name: "صدر", icon: "Dumbbell", color: "text-red-500" },
  { id: "back", name: "ظهر", icon: "ArrowUpDown", color: "text-blue-500" },
  { id: "shoulders", name: "أكتاف", icon: "Target", color: "text-orange-500" },
  { id: "arms", name: "ذراعين", icon: "Dumbbell", color: "text-purple-500" },
  { id: "legs", name: "أرجل", icon: "Footprints", color: "text-green-500" },
  { id: "core", name: "بطن", icon: "Circle", color: "text-amber-500" },
  { id: "cardio", name: "كارديو", icon: "Heart", color: "text-pink-500" },
];

export const workoutPlans: WorkoutPlan[] = [
  // ================= CUTTING PLANS =================
  {
    id: "cut-beginner-3day",
    name: "Fat Burn Starter",
    nameAr: "حرق الدهون للمبتدئين",
    goal: "cut",
    goalAr: "تنشيف",
    level: "beginner",
    levelAr: "مبتدئ",
    daysPerWeek: 3,
    description: "Perfect for beginners starting their fat loss journey",
    descriptionAr: "مثالي للمبتدئين لبدء رحلة حرق الدهون",
    color: "from-orange-500 to-red-500",
    icon: "Flame",
    days: [
      {
        dayNumber: 1,
        name: "Upper Body + Cardio",
        nameAr: "جزء علوي + كارديو",
        focus: "Chest, Back, Shoulders",
        focusAr: "صدر، ظهر، أكتاف",
        estimatedDuration: 45,
        estimatedCalories: 350,
        exercises: [
          { name: "Treadmill Warmup", nameAr: "إحماء على جهاز المشي", sets: 1, reps: "5 دقائق", restSeconds: 0, muscleGroup: "cardio" },
          { name: "Chest Press Machine", nameAr: "جهاز ضغط الصدر", sets: 3, reps: "12-15", restSeconds: 60, muscleGroup: "chest", tips: "ركز على الضغط البطيء" },
          { name: "Lat Pulldown", nameAr: "سحب أمامي", sets: 3, reps: "12-15", restSeconds: 60, muscleGroup: "back" },
          { name: "Shoulder Press Machine", nameAr: "جهاز الكتف", sets: 3, reps: "12-15", restSeconds: 60, muscleGroup: "shoulders" },
          { name: "Incline Walk", nameAr: "مشي منحدر", sets: 1, reps: "15 دقيقة", restSeconds: 0, muscleGroup: "cardio", tips: "منحدر 10-12%" },
        ]
      },
      {
        dayNumber: 2,
        name: "Lower Body + Core",
        nameAr: "جزء سفلي + بطن",
        focus: "Legs, Glutes, Abs",
        focusAr: "أرجل، مؤخرة، بطن",
        estimatedDuration: 45,
        estimatedCalories: 400,
        exercises: [
          { name: "Stationary Bike", nameAr: "دراجة ثابتة", sets: 1, reps: "5 دقائق", restSeconds: 0, muscleGroup: "cardio" },
          { name: "Leg Press", nameAr: "ليج برس", sets: 3, reps: "12-15", restSeconds: 60, muscleGroup: "legs" },
          { name: "Leg Extension", nameAr: "ليج اكستنشن", sets: 3, reps: "15", restSeconds: 45, muscleGroup: "legs" },
          { name: "Leg Curl", nameAr: "ليج كيرل", sets: 3, reps: "15", restSeconds: 45, muscleGroup: "legs" },
          { name: "Crunches", nameAr: "تمارين بطن", sets: 3, reps: "20", restSeconds: 30, muscleGroup: "core" },
          { name: "Plank", nameAr: "بلانك", sets: 3, reps: "30 ثانية", restSeconds: 30, muscleGroup: "core" },
        ]
      },
      {
        dayNumber: 3,
        name: "Full Body HIIT",
        nameAr: "تمرين كامل مكثف",
        focus: "Full Body Cardio",
        focusAr: "كارديو للجسم كامل",
        estimatedDuration: 35,
        estimatedCalories: 450,
        exercises: [
          { name: "Jumping Jacks", nameAr: "قفز مع فتح الذراعين", sets: 3, reps: "30 ثانية", restSeconds: 15, muscleGroup: "cardio" },
          { name: "Burpees", nameAr: "بيربي", sets: 3, reps: "10", restSeconds: 30, muscleGroup: "cardio" },
          { name: "Mountain Climbers", nameAr: "تسلق الجبل", sets: 3, reps: "30 ثانية", restSeconds: 15, muscleGroup: "cardio" },
          { name: "Squats", nameAr: "سكوات", sets: 3, reps: "15", restSeconds: 30, muscleGroup: "legs" },
          { name: "Push-ups", nameAr: "ضغط", sets: 3, reps: "10-15", restSeconds: 30, muscleGroup: "chest" },
          { name: "Treadmill Cooldown", nameAr: "تهدئة على جهاز المشي", sets: 1, reps: "10 دقائق", restSeconds: 0, muscleGroup: "cardio" },
        ]
      }
    ]
  },
  {
    id: "cut-intermediate-5day",
    name: "Shred Program",
    nameAr: "برنامج التنشيف المتقدم",
    goal: "cut",
    goalAr: "تنشيف",
    level: "intermediate",
    levelAr: "متوسط",
    daysPerWeek: 5,
    description: "5-day split for serious fat burning",
    descriptionAr: "برنامج 5 أيام لحرق الدهون بشكل جدي",
    color: "from-red-500 to-rose-600",
    icon: "Flame",
    days: [
      {
        dayNumber: 1,
        name: "Chest + Triceps",
        nameAr: "صدر + تراي",
        focus: "Push Day 1",
        focusAr: "يوم الدفع ١",
        estimatedDuration: 50,
        estimatedCalories: 380,
        exercises: [
          { name: "Incline Dumbbell Press", nameAr: "بنش مائل دمبل", sets: 4, reps: "12", restSeconds: 60, muscleGroup: "chest" },
          { name: "Flat Bench Press", nameAr: "بنش مسطح", sets: 4, reps: "12", restSeconds: 60, muscleGroup: "chest" },
          { name: "Cable Crossover", nameAr: "كيبل كروس", sets: 3, reps: "15", restSeconds: 45, muscleGroup: "chest" },
          { name: "Tricep Pushdown", nameAr: "تراي كيبل", sets: 4, reps: "15", restSeconds: 45, muscleGroup: "arms" },
          { name: "Overhead Extension", nameAr: "تراي خلفي", sets: 3, reps: "12", restSeconds: 45, muscleGroup: "arms" },
          { name: "Incline Walk", nameAr: "مشي منحدر", sets: 1, reps: "15 دقيقة", restSeconds: 0, muscleGroup: "cardio" },
        ]
      },
      {
        dayNumber: 2,
        name: "Back + Biceps",
        nameAr: "ظهر + باي",
        focus: "Pull Day",
        focusAr: "يوم السحب",
        estimatedDuration: 50,
        estimatedCalories: 370,
        exercises: [
          { name: "Lat Pulldown", nameAr: "سحب أمامي", sets: 4, reps: "12", restSeconds: 60, muscleGroup: "back" },
          { name: "Seated Row", nameAr: "سحب أرضي", sets: 4, reps: "12", restSeconds: 60, muscleGroup: "back" },
          { name: "T-Bar Row", nameAr: "تي بار", sets: 3, reps: "10", restSeconds: 60, muscleGroup: "back" },
          { name: "Barbell Curl", nameAr: "باي بار", sets: 4, reps: "12", restSeconds: 45, muscleGroup: "arms" },
          { name: "Hammer Curl", nameAr: "هامر كيرل", sets: 3, reps: "12", restSeconds: 45, muscleGroup: "arms" },
          { name: "Elliptical", nameAr: "الإليبتيكال", sets: 1, reps: "15 دقيقة", restSeconds: 0, muscleGroup: "cardio" },
        ]
      },
      {
        dayNumber: 3,
        name: "Legs",
        nameAr: "أرجل",
        focus: "Leg Day",
        focusAr: "يوم الرجل",
        estimatedDuration: 55,
        estimatedCalories: 450,
        exercises: [
          { name: "Squats", nameAr: "سكوات", sets: 4, reps: "12", restSeconds: 90, muscleGroup: "legs" },
          { name: "Leg Press", nameAr: "ليج برس", sets: 4, reps: "15", restSeconds: 60, muscleGroup: "legs" },
          { name: "Leg Extension", nameAr: "ليج اكستنشن", sets: 4, reps: "15", restSeconds: 45, muscleGroup: "legs" },
          { name: "Leg Curl", nameAr: "ليج كيرل", sets: 4, reps: "15", restSeconds: 45, muscleGroup: "legs" },
          { name: "Calf Raise", nameAr: "كاف ريز", sets: 4, reps: "20", restSeconds: 30, muscleGroup: "legs" },
          { name: "Stationary Bike", nameAr: "دراجة ثابتة", sets: 1, reps: "10 دقائق", restSeconds: 0, muscleGroup: "cardio" },
        ]
      },
      {
        dayNumber: 4,
        name: "Shoulders + Abs",
        nameAr: "أكتاف + بطن",
        focus: "Push Day 2",
        focusAr: "يوم الدفع ٢",
        estimatedDuration: 45,
        estimatedCalories: 320,
        exercises: [
          { name: "Shoulder Press", nameAr: "شولدر برس", sets: 4, reps: "12", restSeconds: 60, muscleGroup: "shoulders" },
          { name: "Lateral Raise", nameAr: "رفرفة جانبي", sets: 4, reps: "15", restSeconds: 45, muscleGroup: "shoulders" },
          { name: "Front Raise", nameAr: "رفرفة أمامي", sets: 3, reps: "12", restSeconds: 45, muscleGroup: "shoulders" },
          { name: "Rear Delt Fly", nameAr: "خلفي كتف", sets: 3, reps: "15", restSeconds: 45, muscleGroup: "shoulders" },
          { name: "Cable Crunch", nameAr: "كيبل كرنش", sets: 4, reps: "20", restSeconds: 30, muscleGroup: "core" },
          { name: "Plank", nameAr: "بلانك", sets: 3, reps: "45 ثانية", restSeconds: 30, muscleGroup: "core" },
        ]
      },
      {
        dayNumber: 5,
        name: "HIIT Cardio",
        nameAr: "كارديو مكثف",
        focus: "Fat Burning",
        focusAr: "حرق الدهون",
        estimatedDuration: 40,
        estimatedCalories: 500,
        exercises: [
          { name: "Treadmill Intervals", nameAr: "فترات على جهاز المشي", sets: 10, reps: "30 ثانية سريع / 30 راحة", restSeconds: 30, muscleGroup: "cardio" },
          { name: "Rowing Machine", nameAr: "جهاز التجديف", sets: 1, reps: "10 دقائق", restSeconds: 60, muscleGroup: "cardio" },
          { name: "Battle Ropes", nameAr: "حبال المعركة", sets: 4, reps: "30 ثانية", restSeconds: 30, muscleGroup: "cardio" },
          { name: "Box Jumps", nameAr: "قفز على صندوق", sets: 3, reps: "10", restSeconds: 45, muscleGroup: "legs" },
          { name: "Stretching", nameAr: "تمدد", sets: 1, reps: "5 دقائق", restSeconds: 0, muscleGroup: "cardio" },
        ]
      }
    ]
  },

  // ================= BULKING PLANS =================
  {
    id: "bulk-beginner-4day",
    name: "Mass Builder",
    nameAr: "بناء الكتلة للمبتدئين",
    goal: "bulk",
    goalAr: "تضخيم",
    level: "beginner",
    levelAr: "مبتدئ",
    daysPerWeek: 4,
    description: "Build muscle with this 4-day program",
    descriptionAr: "ابني عضلاتك مع هذا البرنامج",
    color: "from-green-500 to-emerald-600",
    icon: "Dumbbell",
    days: [
      {
        dayNumber: 1,
        name: "Chest + Triceps",
        nameAr: "صدر + تراي",
        focus: "Upper Push",
        focusAr: "دفع علوي",
        estimatedDuration: 50,
        estimatedCalories: 280,
        exercises: [
          { name: "Flat Bench Press", nameAr: "بنش مسطح", sets: 4, reps: "8-10", restSeconds: 90, muscleGroup: "chest", tips: "أوزان ثقيلة مع تركيز" },
          { name: "Incline Dumbbell Press", nameAr: "بنش مائل دمبل", sets: 4, reps: "10", restSeconds: 90, muscleGroup: "chest" },
          { name: "Pec Deck", nameAr: "تفتيح صدر", sets: 3, reps: "12", restSeconds: 60, muscleGroup: "chest" },
          { name: "Close Grip Bench", nameAr: "بنش قبضة ضيقة", sets: 3, reps: "10", restSeconds: 60, muscleGroup: "arms" },
          { name: "Tricep Pushdown", nameAr: "تراي كيبل", sets: 3, reps: "12", restSeconds: 60, muscleGroup: "arms" },
          { name: "Overhead Tricep", nameAr: "تراي فوق الرأس", sets: 3, reps: "12", restSeconds: 60, muscleGroup: "arms" },
        ]
      },
      {
        dayNumber: 2,
        name: "Back + Biceps",
        nameAr: "ظهر + باي",
        focus: "Upper Pull",
        focusAr: "سحب علوي",
        estimatedDuration: 55,
        estimatedCalories: 300,
        exercises: [
          { name: "Deadlift", nameAr: "ديدلفت", sets: 4, reps: "6-8", restSeconds: 120, muscleGroup: "back", tips: "حافظ على استقامة الظهر" },
          { name: "Barbell Row", nameAr: "سحب بار", sets: 4, reps: "8-10", restSeconds: 90, muscleGroup: "back" },
          { name: "Lat Pulldown", nameAr: "سحب أمامي", sets: 4, reps: "10", restSeconds: 60, muscleGroup: "back" },
          { name: "Seated Row", nameAr: "سحب أرضي", sets: 3, reps: "12", restSeconds: 60, muscleGroup: "back" },
          { name: "Barbell Curl", nameAr: "باي بار", sets: 4, reps: "10", restSeconds: 60, muscleGroup: "arms" },
          { name: "Incline Dumbbell Curl", nameAr: "باي دمبل مائل", sets: 3, reps: "12", restSeconds: 60, muscleGroup: "arms" },
        ]
      },
      {
        dayNumber: 3,
        name: "Legs",
        nameAr: "أرجل",
        focus: "Lower Body",
        focusAr: "جزء سفلي",
        estimatedDuration: 60,
        estimatedCalories: 400,
        exercises: [
          { name: "Squats", nameAr: "سكوات", sets: 5, reps: "8", restSeconds: 120, muscleGroup: "legs", tips: "عميق للمؤخرة والفخذ" },
          { name: "Leg Press", nameAr: "ليج برس", sets: 4, reps: "12", restSeconds: 90, muscleGroup: "legs" },
          { name: "Romanian Deadlift", nameAr: "ديدلفت روماني", sets: 4, reps: "10", restSeconds: 90, muscleGroup: "legs" },
          { name: "Leg Extension", nameAr: "ليج اكستنشن", sets: 3, reps: "15", restSeconds: 60, muscleGroup: "legs" },
          { name: "Leg Curl", nameAr: "ليج كيرل", sets: 3, reps: "15", restSeconds: 60, muscleGroup: "legs" },
          { name: "Calf Raise", nameAr: "كاف ريز", sets: 4, reps: "15", restSeconds: 45, muscleGroup: "legs" },
        ]
      },
      {
        dayNumber: 4,
        name: "Shoulders + Arms",
        nameAr: "أكتاف + ذراعين",
        focus: "Upper Body",
        focusAr: "جزء علوي",
        estimatedDuration: 50,
        estimatedCalories: 260,
        exercises: [
          { name: "Overhead Press", nameAr: "ضغط فوق الرأس", sets: 4, reps: "8-10", restSeconds: 90, muscleGroup: "shoulders" },
          { name: "Lateral Raise", nameAr: "رفرفة جانبي", sets: 4, reps: "12", restSeconds: 60, muscleGroup: "shoulders" },
          { name: "Rear Delt Fly", nameAr: "خلفي كتف", sets: 3, reps: "15", restSeconds: 45, muscleGroup: "shoulders" },
          { name: "EZ Bar Curl", nameAr: "باي EZ بار", sets: 3, reps: "10", restSeconds: 60, muscleGroup: "arms" },
          { name: "Skull Crusher", nameAr: "سكل كراشر", sets: 3, reps: "10", restSeconds: 60, muscleGroup: "arms" },
          { name: "Hammer Curl", nameAr: "هامر كيرل", sets: 3, reps: "12", restSeconds: 45, muscleGroup: "arms" },
        ]
      }
    ]
  },
  {
    id: "bulk-advanced-6day",
    name: "PPL Power",
    nameAr: "برنامج القوة PPL",
    goal: "bulk",
    goalAr: "تضخيم",
    level: "advanced",
    levelAr: "متقدم",
    daysPerWeek: 6,
    description: "Push/Pull/Legs twice a week for maximum gains",
    descriptionAr: "دفع/سحب/رجل مرتين أسبوعياً لأقصى نمو",
    color: "from-emerald-500 to-green-600",
    icon: "Trophy",
    days: [
      {
        dayNumber: 1,
        name: "Push A (Heavy)",
        nameAr: "دفع أ (ثقيل)",
        focus: "Chest, Shoulders, Triceps",
        focusAr: "صدر، أكتاف، تراي",
        estimatedDuration: 65,
        estimatedCalories: 350,
        exercises: [
          { name: "Bench Press", nameAr: "بنش مسطح", sets: 5, reps: "5", restSeconds: 180, muscleGroup: "chest" },
          { name: "Overhead Press", nameAr: "أوفر هيد برس", sets: 4, reps: "6", restSeconds: 120, muscleGroup: "shoulders" },
          { name: "Incline Dumbbell Press", nameAr: "بنش مائل دمبل", sets: 4, reps: "8", restSeconds: 90, muscleGroup: "chest" },
          { name: "Lateral Raise", nameAr: "رفرفة جانبي", sets: 4, reps: "12", restSeconds: 60, muscleGroup: "shoulders" },
          { name: "Tricep Dips", nameAr: "متوازي", sets: 3, reps: "10", restSeconds: 90, muscleGroup: "arms" },
          { name: "Tricep Pushdown", nameAr: "تراي كيبل", sets: 3, reps: "12", restSeconds: 60, muscleGroup: "arms" },
        ]
      },
      {
        dayNumber: 2,
        name: "Pull A (Heavy)",
        nameAr: "سحب أ (ثقيل)",
        focus: "Back, Biceps",
        focusAr: "ظهر، باي",
        estimatedDuration: 60,
        estimatedCalories: 340,
        exercises: [
          { name: "Deadlift", nameAr: "ديدلفت", sets: 5, reps: "5", restSeconds: 180, muscleGroup: "back" },
          { name: "Weighted Pull-ups", nameAr: "عقلة بوزن", sets: 4, reps: "6-8", restSeconds: 120, muscleGroup: "back" },
          { name: "Barbell Row", nameAr: "سحب بار", sets: 4, reps: "8", restSeconds: 90, muscleGroup: "back" },
          { name: "Face Pull", nameAr: "فيس بول", sets: 3, reps: "15", restSeconds: 60, muscleGroup: "back" },
          { name: "Barbell Curl", nameAr: "باي بار", sets: 4, reps: "8", restSeconds: 60, muscleGroup: "arms" },
          { name: "Hammer Curl", nameAr: "هامر كيرل", sets: 3, reps: "12", restSeconds: 60, muscleGroup: "arms" },
        ]
      },
      {
        dayNumber: 3,
        name: "Legs A (Heavy)",
        nameAr: "رجل أ (ثقيل)",
        focus: "Quads, Hamstrings, Calves",
        focusAr: "فخذ أمامي، خلفي، سمانة",
        estimatedDuration: 70,
        estimatedCalories: 450,
        exercises: [
          { name: "Back Squat", nameAr: "سكوات خلفي", sets: 5, reps: "5", restSeconds: 180, muscleGroup: "legs" },
          { name: "Front Squat", nameAr: "سكوات أمامي", sets: 4, reps: "8", restSeconds: 120, muscleGroup: "legs" },
          { name: "Romanian Deadlift", nameAr: "ديدلفت روماني", sets: 4, reps: "10", restSeconds: 90, muscleGroup: "legs" },
          { name: "Leg Press", nameAr: "ليج برس", sets: 3, reps: "12", restSeconds: 90, muscleGroup: "legs" },
          { name: "Leg Curl", nameAr: "ليج كيرل", sets: 3, reps: "12", restSeconds: 60, muscleGroup: "legs" },
          { name: "Standing Calf Raise", nameAr: "كاف واقف", sets: 4, reps: "15", restSeconds: 45, muscleGroup: "legs" },
        ]
      },
      {
        dayNumber: 4,
        name: "Push B (Volume)",
        nameAr: "دفع ب (حجم)",
        focus: "Chest, Shoulders, Triceps",
        focusAr: "صدر، أكتاف، تراي",
        estimatedDuration: 55,
        estimatedCalories: 300,
        exercises: [
          { name: "Incline Bench Press", nameAr: "بنش مائل", sets: 4, reps: "10", restSeconds: 90, muscleGroup: "chest" },
          { name: "Dumbbell Fly", nameAr: "تفتيح دمبل", sets: 4, reps: "12", restSeconds: 60, muscleGroup: "chest" },
          { name: "Machine Shoulder Press", nameAr: "شولدر برس جهاز", sets: 4, reps: "12", restSeconds: 60, muscleGroup: "shoulders" },
          { name: "Cable Lateral Raise", nameAr: "رفرفة كيبل", sets: 4, reps: "15", restSeconds: 45, muscleGroup: "shoulders" },
          { name: "Overhead Extension", nameAr: "تراي فوق الرأس", sets: 3, reps: "12", restSeconds: 60, muscleGroup: "arms" },
          { name: "Close Grip Pushdown", nameAr: "ضغط قبضة ضيقة", sets: 3, reps: "15", restSeconds: 45, muscleGroup: "arms" },
        ]
      },
      {
        dayNumber: 5,
        name: "Pull B (Volume)",
        nameAr: "سحب ب (حجم)",
        focus: "Back, Biceps",
        focusAr: "ظهر، باي",
        estimatedDuration: 55,
        estimatedCalories: 290,
        exercises: [
          { name: "Lat Pulldown", nameAr: "سحب أمامي", sets: 4, reps: "12", restSeconds: 60, muscleGroup: "back" },
          { name: "Cable Row", nameAr: "سحب كيبل", sets: 4, reps: "12", restSeconds: 60, muscleGroup: "back" },
          { name: "T-Bar Row", nameAr: "تي بار", sets: 3, reps: "10", restSeconds: 90, muscleGroup: "back" },
          { name: "Rear Delt Fly", nameAr: "خلفي كتف", sets: 4, reps: "15", restSeconds: 45, muscleGroup: "shoulders" },
          { name: "Incline Curl", nameAr: "باي مائل", sets: 4, reps: "12", restSeconds: 60, muscleGroup: "arms" },
          { name: "Concentration Curl", nameAr: "باي تركيز", sets: 3, reps: "12", restSeconds: 45, muscleGroup: "arms" },
        ]
      },
      {
        dayNumber: 6,
        name: "Legs B (Volume)",
        nameAr: "رجل ب (حجم)",
        focus: "Quads, Hamstrings, Glutes",
        focusAr: "فخذ، مؤخرة",
        estimatedDuration: 60,
        estimatedCalories: 400,
        exercises: [
          { name: "Hack Squat", nameAr: "هاك سكوات", sets: 4, reps: "12", restSeconds: 90, muscleGroup: "legs" },
          { name: "Walking Lunges", nameAr: "لانجز مشي", sets: 3, reps: "20 خطوة", restSeconds: 60, muscleGroup: "legs" },
          { name: "Leg Extension", nameAr: "ليج اكستنشن", sets: 4, reps: "15", restSeconds: 45, muscleGroup: "legs" },
          { name: "Leg Curl", nameAr: "ليج كيرل", sets: 4, reps: "15", restSeconds: 45, muscleGroup: "legs" },
          { name: "Hip Thrust", nameAr: "هيب ثراست", sets: 4, reps: "12", restSeconds: 60, muscleGroup: "legs" },
          { name: "Seated Calf Raise", nameAr: "كاف جالس", sets: 4, reps: "20", restSeconds: 30, muscleGroup: "legs" },
        ]
      }
    ]
  },

  // ================= MAINTENANCE PLANS =================
  {
    id: "maintain-3day",
    name: "Fitness Maintain",
    nameAr: "المحافظة على اللياقة",
    goal: "maintain",
    goalAr: "ثبات",
    level: "intermediate",
    levelAr: "متوسط",
    daysPerWeek: 3,
    description: "Maintain your physique with 3 days a week",
    descriptionAr: "حافظ على جسمك بـ 3 أيام أسبوعياً",
    color: "from-blue-500 to-indigo-600",
    icon: "Scale",
    days: [
      {
        dayNumber: 1,
        name: "Upper Body",
        nameAr: "جزء علوي",
        focus: "Chest, Back, Arms",
        focusAr: "صدر، ظهر، ذراعين",
        estimatedDuration: 50,
        estimatedCalories: 300,
        exercises: [
          { name: "Bench Press", nameAr: "بنش مسطح", sets: 3, reps: "10", restSeconds: 90, muscleGroup: "chest" },
          { name: "Lat Pulldown", nameAr: "سحب أمامي", sets: 3, reps: "10", restSeconds: 90, muscleGroup: "back" },
          { name: "Dumbbell Row", nameAr: "سحب دمبل", sets: 3, reps: "10", restSeconds: 60, muscleGroup: "back" },
          { name: "Shoulder Press", nameAr: "شولدر برس", sets: 3, reps: "12", restSeconds: 60, muscleGroup: "shoulders" },
          { name: "Barbell Curl", nameAr: "باي بار", sets: 3, reps: "12", restSeconds: 60, muscleGroup: "arms" },
          { name: "Tricep Pushdown", nameAr: "تراي كيبل", sets: 3, reps: "12", restSeconds: 60, muscleGroup: "arms" },
        ]
      },
      {
        dayNumber: 2,
        name: "Lower Body",
        nameAr: "جزء سفلي",
        focus: "Legs, Core",
        focusAr: "أرجل، بطن",
        estimatedDuration: 50,
        estimatedCalories: 350,
        exercises: [
          { name: "Squats", nameAr: "سكوات", sets: 4, reps: "10", restSeconds: 120, muscleGroup: "legs" },
          { name: "Leg Press", nameAr: "ليج برس", sets: 3, reps: "12", restSeconds: 90, muscleGroup: "legs" },
          { name: "Leg Curl", nameAr: "ليج كيرل", sets: 3, reps: "12", restSeconds: 60, muscleGroup: "legs" },
          { name: "Calf Raise", nameAr: "كاف ريز", sets: 4, reps: "15", restSeconds: 45, muscleGroup: "legs" },
          { name: "Plank", nameAr: "بلانك", sets: 3, reps: "45 ثانية", restSeconds: 30, muscleGroup: "core" },
          { name: "Cable Crunch", nameAr: "كيبل كرنش", sets: 3, reps: "15", restSeconds: 45, muscleGroup: "core" },
        ]
      },
      {
        dayNumber: 3,
        name: "Full Body + Cardio",
        nameAr: "جسم كامل + كارديو",
        focus: "Total Body",
        focusAr: "الجسم كامل",
        estimatedDuration: 55,
        estimatedCalories: 380,
        exercises: [
          { name: "Deadlift", nameAr: "ديدلفت", sets: 3, reps: "8", restSeconds: 120, muscleGroup: "back" },
          { name: "Incline Press", nameAr: "بنش مائل", sets: 3, reps: "10", restSeconds: 60, muscleGroup: "chest" },
          { name: "Lunges", nameAr: "لانجز", sets: 3, reps: "12 لكل رجل", restSeconds: 60, muscleGroup: "legs" },
          { name: "Lateral Raise", nameAr: "رفرفة جانبي", sets: 3, reps: "15", restSeconds: 45, muscleGroup: "shoulders" },
          { name: "Treadmill", nameAr: "جهاز المشي", sets: 1, reps: "20 دقيقة", restSeconds: 0, muscleGroup: "cardio" },
        ]
      }
    ]
  },

  // ================= STRENGTH PLAN =================
  {
    id: "strength-5x5",
    name: "5x5 Strength",
    nameAr: "برنامج القوة 5×5",
    goal: "strength",
    goalAr: "قوة",
    level: "intermediate",
    levelAr: "متوسط",
    daysPerWeek: 3,
    description: "Classic 5x5 program for building raw strength",
    descriptionAr: "برنامج كلاسيكي لبناء القوة الخام",
    color: "from-purple-500 to-violet-600",
    icon: "Weight",
    days: [
      {
        dayNumber: 1,
        name: "Workout A",
        nameAr: "تمرين أ",
        focus: "Squat, Bench, Row",
        focusAr: "سكوات، بنش، سحب",
        estimatedDuration: 60,
        estimatedCalories: 350,
        exercises: [
          { name: "Squat", nameAr: "سكوات", sets: 5, reps: "5", restSeconds: 180, muscleGroup: "legs", tips: "زد الوزن 2.5 كجم كل تمرين" },
          { name: "Bench Press", nameAr: "بنش مسطح", sets: 5, reps: "5", restSeconds: 180, muscleGroup: "chest" },
          { name: "Barbell Row", nameAr: "سحب بار", sets: 5, reps: "5", restSeconds: 180, muscleGroup: "back" },
        ]
      },
      {
        dayNumber: 2,
        name: "Workout B",
        nameAr: "تمرين ب",
        focus: "Squat, OHP, Deadlift",
        focusAr: "سكوات، أوفر هيد، ديدلفت",
        estimatedDuration: 65,
        estimatedCalories: 380,
        exercises: [
          { name: "Squat", nameAr: "سكوات", sets: 5, reps: "5", restSeconds: 180, muscleGroup: "legs" },
          { name: "Overhead Press", nameAr: "ضغط فوق الرأس", sets: 5, reps: "5", restSeconds: 180, muscleGroup: "shoulders" },
          { name: "Deadlift", nameAr: "ديدلفت", sets: 1, reps: "5", restSeconds: 180, muscleGroup: "back", tips: "مجموعة واحدة ثقيلة فقط" },
        ]
      },
      {
        dayNumber: 3,
        name: "Workout A",
        nameAr: "تمرين أ",
        focus: "Squat, Bench, Row",
        focusAr: "سكوات، بنش، سحب",
        estimatedDuration: 60,
        estimatedCalories: 350,
        exercises: [
          { name: "Squat", nameAr: "سكوات", sets: 5, reps: "5", restSeconds: 180, muscleGroup: "legs" },
          { name: "Bench Press", nameAr: "بنش مسطح", sets: 5, reps: "5", restSeconds: 180, muscleGroup: "chest" },
          { name: "Barbell Row", nameAr: "سحب بار", sets: 5, reps: "5", restSeconds: 180, muscleGroup: "back" },
        ]
      }
    ]
  },

  // ================= ENDURANCE/HOME PLAN =================
  {
    id: "home-hiit",
    name: "Home HIIT",
    nameAr: "هيت منزلي",
    goal: "endurance",
    goalAr: "تحمل",
    level: "beginner",
    levelAr: "مبتدئ",
    daysPerWeek: 4,
    description: "No equipment needed - train at home",
    descriptionAr: "بدون معدات - تمرن في البيت",
    color: "from-pink-500 to-rose-600",
    icon: "Home",
    days: [
      {
        dayNumber: 1,
        name: "Upper Body HIIT",
        nameAr: "جزء علوي مكثف",
        focus: "Chest, Arms, Core",
        focusAr: "صدر، ذراعين، بطن",
        estimatedDuration: 25,
        estimatedCalories: 280,
        exercises: [
          { name: "Push-ups", nameAr: "ضغط", sets: 4, reps: "15", restSeconds: 30, muscleGroup: "chest" },
          { name: "Diamond Push-ups", nameAr: "ضغط ماسي", sets: 3, reps: "10", restSeconds: 30, muscleGroup: "arms" },
          { name: "Pike Push-ups", nameAr: "ضغط بايك", sets: 3, reps: "10", restSeconds: 30, muscleGroup: "shoulders" },
          { name: "Plank Shoulder Tap", nameAr: "بلانك مع لمس الكتف", sets: 3, reps: "20", restSeconds: 30, muscleGroup: "core" },
          { name: "Mountain Climbers", nameAr: "تسلق الجبل", sets: 4, reps: "30 ثانية", restSeconds: 15, muscleGroup: "cardio" },
        ]
      },
      {
        dayNumber: 2,
        name: "Lower Body HIIT",
        nameAr: "جزء سفلي مكثف",
        focus: "Legs, Glutes",
        focusAr: "أرجل، مؤخرة",
        estimatedDuration: 25,
        estimatedCalories: 300,
        exercises: [
          { name: "Jump Squats", nameAr: "سكوات قفز", sets: 4, reps: "15", restSeconds: 30, muscleGroup: "legs" },
          { name: "Lunges", nameAr: "لانجز", sets: 3, reps: "12 لكل رجل", restSeconds: 30, muscleGroup: "legs" },
          { name: "Glute Bridge", nameAr: "جسر المؤخرة", sets: 4, reps: "20", restSeconds: 30, muscleGroup: "legs" },
          { name: "Wall Sit", nameAr: "جلسة الحائط", sets: 3, reps: "45 ثانية", restSeconds: 30, muscleGroup: "legs" },
          { name: "Calf Raises", nameAr: "رفع السمانة", sets: 4, reps: "25", restSeconds: 20, muscleGroup: "legs" },
        ]
      },
      {
        dayNumber: 3,
        name: "Core Blast",
        nameAr: "تفجير البطن",
        focus: "Abs, Obliques",
        focusAr: "بطن، جوانب",
        estimatedDuration: 20,
        estimatedCalories: 200,
        exercises: [
          { name: "Crunches", nameAr: "كرنشز", sets: 4, reps: "25", restSeconds: 20, muscleGroup: "core" },
          { name: "Bicycle Crunches", nameAr: "كرنشز دراجة", sets: 4, reps: "20", restSeconds: 20, muscleGroup: "core" },
          { name: "Leg Raises", nameAr: "رفع الأرجل", sets: 4, reps: "15", restSeconds: 30, muscleGroup: "core" },
          { name: "Russian Twist", nameAr: "لف روسي", sets: 3, reps: "30", restSeconds: 30, muscleGroup: "core" },
          { name: "Plank", nameAr: "بلانك", sets: 3, reps: "60 ثانية", restSeconds: 30, muscleGroup: "core" },
        ]
      },
      {
        dayNumber: 4,
        name: "Full Body Burn",
        nameAr: "حرق كامل",
        focus: "Total Body Cardio",
        focusAr: "كارديو جسم كامل",
        estimatedDuration: 30,
        estimatedCalories: 400,
        exercises: [
          { name: "Burpees", nameAr: "بيربي", sets: 4, reps: "10", restSeconds: 30, muscleGroup: "cardio" },
          { name: "High Knees", nameAr: "ركب عالية", sets: 4, reps: "30 ثانية", restSeconds: 15, muscleGroup: "cardio" },
          { name: "Jumping Jacks", nameAr: "قفز مع فتح", sets: 4, reps: "30", restSeconds: 15, muscleGroup: "cardio" },
          { name: "Jump Squats", nameAr: "سكوات قفز", sets: 3, reps: "15", restSeconds: 30, muscleGroup: "legs" },
          { name: "Push-ups", nameAr: "ضغط", sets: 3, reps: "15", restSeconds: 30, muscleGroup: "chest" },
          { name: "Cool Down Stretch", nameAr: "تمدد تهدئة", sets: 1, reps: "5 دقائق", restSeconds: 0, muscleGroup: "cardio" },
        ]
      }
    ]
  }
];

export const getPlansbyGoal = (goal: string) => {
  return workoutPlans.filter(plan => plan.goal === goal);
};

export const getPlanById = (id: string) => {
  return workoutPlans.find(plan => plan.id === id);
};
