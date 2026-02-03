import { db } from "./db";
import { challenges } from "@shared/schema";

const dailyChallenges = [
  {
    title: "Drink 8 Glasses of Water",
    titleAr: "اشرب 8 أكواب ماء",
    description: "Stay hydrated throughout the day",
    descriptionAr: "حافظ على ترطيب جسمك طوال اليوم",
    type: "water",
    targetValue: 8,
    points: 10,
    icon: "droplets",
  },
  {
    title: "Stay Under Calorie Goal",
    titleAr: "التزم بحد السعرات",
    description: "Don't exceed your daily calorie target",
    descriptionAr: "لا تتجاوز هدفك اليومي من السعرات",
    type: "calories",
    targetValue: 1,
    points: 15,
    icon: "flame",
  },
  {
    title: "Hit Protein Target",
    titleAr: "حقق هدف البروتين",
    description: "Reach your daily protein goal",
    descriptionAr: "حقق هدفك اليومي من البروتين",
    type: "protein",
    targetValue: 1,
    points: 15,
    icon: "beef",
  },
  {
    title: "Log 3 Meals",
    titleAr: "سجل 3 وجبات",
    description: "Track at least 3 meals today",
    descriptionAr: "سجل على الأقل 3 وجبات اليوم",
    type: "meals",
    targetValue: 3,
    points: 10,
    icon: "utensils",
  },
  {
    title: "Exercise for 30 Minutes",
    titleAr: "تمرن لمدة 30 دقيقة",
    description: "Complete at least 30 minutes of exercise",
    descriptionAr: "أكمل 30 دقيقة على الأقل من التمارين",
    type: "exercise",
    targetValue: 30,
    points: 20,
    icon: "dumbbell",
  },
  {
    title: "Burn 200 Calories",
    titleAr: "احرق 200 سعرة",
    description: "Burn at least 200 calories through exercise",
    descriptionAr: "احرق 200 سعرة على الأقل من خلال التمارين",
    type: "exercise_calories",
    targetValue: 200,
    points: 15,
    icon: "fire",
  },
  {
    title: "Eat 5 Servings of Vegetables",
    titleAr: "تناول 5 حصص خضار",
    description: "Include vegetables in your meals",
    descriptionAr: "أضف الخضار إلى وجباتك",
    type: "vegetables",
    targetValue: 5,
    points: 10,
    icon: "salad",
  },
  {
    title: "No Sugary Drinks",
    titleAr: "بدون مشروبات سكرية",
    description: "Avoid sugary beverages today",
    descriptionAr: "تجنب المشروبات السكرية اليوم",
    type: "no_sugar",
    targetValue: 1,
    points: 15,
    icon: "cup-soda",
  },
];

export async function seedChallenges() {
  const existingChallenges = await db.select().from(challenges).limit(1);
  if (existingChallenges.length > 0) {
    console.log("Challenges already seeded, skipping...");
    return;
  }

  console.log("Seeding challenges...");
  for (const challenge of dailyChallenges) {
    await db.insert(challenges).values(challenge);
  }
  console.log(`Seeded ${dailyChallenges.length} challenges!`);
}
