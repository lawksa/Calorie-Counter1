import { db } from "./db";
import { restaurants, menuItems } from "@shared/schema";

const saudiRestaurants = [
  {
    name: "Al Baik",
    nameAr: "البيك",
    logo: null,
    category: "fast_food",
    menu: [
      { name: "Broasted Chicken (2pc)", nameAr: "دجاج بروستد (قطعتين)", calories: 450, protein: 35, carbs: 20, fats: 28, category: "main" },
      { name: "Broasted Chicken (3pc)", nameAr: "دجاج بروستد (3 قطع)", calories: 675, protein: 52, carbs: 30, fats: 42, category: "main" },
      { name: "Shrimp Meal", nameAr: "وجبة روبيان", calories: 520, protein: 22, carbs: 45, fats: 28, category: "main" },
      { name: "Fish Fillet Meal", nameAr: "وجبة فيليه السمك", calories: 480, protein: 25, carbs: 40, fats: 24, category: "main" },
      { name: "Nuggets (6pc)", nameAr: "ناجتس (6 قطع)", calories: 280, protein: 18, carbs: 18, fats: 16, category: "main" },
      { name: "French Fries (Regular)", nameAr: "بطاطس (عادي)", calories: 220, protein: 3, carbs: 30, fats: 10, category: "sides" },
      { name: "French Fries (Large)", nameAr: "بطاطس (كبير)", calories: 380, protein: 5, carbs: 52, fats: 18, category: "sides" },
      { name: "Coleslaw", nameAr: "كول سلو", calories: 120, protein: 1, carbs: 8, fats: 9, category: "sides" },
      { name: "Garlic Sauce", nameAr: "صوص ثوم", calories: 90, protein: 0, carbs: 2, fats: 9, category: "sides" },
    ]
  },
  {
    name: "Kudu",
    nameAr: "كودو",
    logo: null,
    category: "fast_food",
    menu: [
      { name: "Kudu Burger", nameAr: "برجر كودو", calories: 580, protein: 28, carbs: 42, fats: 35, category: "main" },
      { name: "Double Kudu Burger", nameAr: "برجر كودو دبل", calories: 850, protein: 45, carbs: 48, fats: 52, category: "main" },
      { name: "Chicken Fillet Sandwich", nameAr: "ساندوتش فيليه دجاج", calories: 520, protein: 32, carbs: 38, fats: 28, category: "main" },
      { name: "Grilled Chicken Wrap", nameAr: "راب دجاج مشوي", calories: 420, protein: 28, carbs: 35, fats: 18, category: "main" },
      { name: "Shrimp Sandwich", nameAr: "ساندوتش روبيان", calories: 480, protein: 20, carbs: 42, fats: 26, category: "main" },
      { name: "Fries (Medium)", nameAr: "بطاطس (وسط)", calories: 290, protein: 4, carbs: 38, fats: 14, category: "sides" },
      { name: "Onion Rings", nameAr: "حلقات البصل", calories: 310, protein: 5, carbs: 35, fats: 16, category: "sides" },
    ]
  },
  {
    name: "Herfy",
    nameAr: "هرفي",
    logo: null,
    category: "fast_food",
    menu: [
      { name: "Herfy Burger", nameAr: "برجر هرفي", calories: 520, protein: 26, carbs: 38, fats: 30, category: "main" },
      { name: "Super Herfy", nameAr: "سوبر هرفي", calories: 750, protein: 40, carbs: 45, fats: 48, category: "main" },
      { name: "Chicken Burger", nameAr: "برجر دجاج", calories: 480, protein: 28, carbs: 36, fats: 26, category: "main" },
      { name: "Falafel Sandwich", nameAr: "ساندوتش فلافل", calories: 380, protein: 12, carbs: 45, fats: 18, category: "main" },
      { name: "Shawarma", nameAr: "شاورما", calories: 420, protein: 22, carbs: 38, fats: 22, category: "main" },
      { name: "Fries (Regular)", nameAr: "بطاطس (عادي)", calories: 250, protein: 3, carbs: 32, fats: 12, category: "sides" },
    ]
  },
  {
    name: "Shawaya House",
    nameAr: "بيت الشواية",
    logo: null,
    category: "saudi",
    menu: [
      { name: "Whole Grilled Chicken", nameAr: "دجاج مشوي كامل", calories: 900, protein: 85, carbs: 5, fats: 60, category: "main" },
      { name: "Half Grilled Chicken", nameAr: "نصف دجاج مشوي", calories: 450, protein: 42, carbs: 3, fats: 30, category: "main" },
      { name: "Quarter Chicken", nameAr: "ربع دجاج", calories: 225, protein: 21, carbs: 2, fats: 15, category: "main" },
      { name: "Mixed Grill Platter", nameAr: "طبق مشاوي مشكل", calories: 850, protein: 65, carbs: 15, fats: 58, category: "main" },
      { name: "Kebab Plate", nameAr: "طبق كباب", calories: 520, protein: 38, carbs: 8, fats: 38, category: "main" },
      { name: "Hummus", nameAr: "حمص", calories: 180, protein: 6, carbs: 18, fats: 10, category: "sides" },
      { name: "Fattoush Salad", nameAr: "سلطة فتوش", calories: 150, protein: 3, carbs: 18, fats: 8, category: "sides" },
      { name: "Tabbouleh", nameAr: "تبولة", calories: 120, protein: 3, carbs: 15, fats: 6, category: "sides" },
      { name: "Arabic Rice", nameAr: "أرز عربي", calories: 280, protein: 5, carbs: 55, fats: 5, category: "sides" },
    ]
  },
  {
    name: "Maestro Pizza",
    nameAr: "مايسترو بيتزا",
    logo: null,
    category: "fast_food",
    menu: [
      { name: "Pepperoni Pizza (Medium)", nameAr: "بيتزا بيبروني (وسط)", calories: 280, protein: 12, carbs: 30, fats: 14, category: "main" },
      { name: "Margherita Pizza (Medium)", nameAr: "بيتزا مارجريتا (وسط)", calories: 250, protein: 10, carbs: 28, fats: 12, category: "main" },
      { name: "BBQ Chicken Pizza (Medium)", nameAr: "بيتزا دجاج باربكيو (وسط)", calories: 290, protein: 14, carbs: 32, fats: 12, category: "main" },
      { name: "Meat Lovers Pizza (Medium)", nameAr: "بيتزا عشاق اللحم (وسط)", calories: 340, protein: 16, carbs: 30, fats: 18, category: "main" },
      { name: "Garlic Bread", nameAr: "خبز بالثوم", calories: 180, protein: 4, carbs: 22, fats: 9, category: "sides" },
    ]
  },
  {
    name: "Starbucks",
    nameAr: "ستاربكس",
    logo: null,
    category: "coffee",
    menu: [
      { name: "Caffe Latte (Grande)", nameAr: "كافيه لاتيه (غراندي)", calories: 190, protein: 13, carbs: 18, fats: 7, category: "drinks" },
      { name: "Cappuccino (Grande)", nameAr: "كابتشينو (غراندي)", calories: 140, protein: 10, carbs: 12, fats: 5, category: "drinks" },
      { name: "Caramel Macchiato (Grande)", nameAr: "كراميل ماكياتو (غراندي)", calories: 250, protein: 10, carbs: 35, fats: 7, category: "drinks" },
      { name: "Mocha (Grande)", nameAr: "موكا (غراندي)", calories: 360, protein: 12, carbs: 45, fats: 15, category: "drinks" },
      { name: "Iced Americano (Grande)", nameAr: "أمريكانو مثلج (غراندي)", calories: 15, protein: 1, carbs: 3, fats: 0, category: "drinks" },
      { name: "Chocolate Croissant", nameAr: "كرواسون شوكولاتة", calories: 340, protein: 5, carbs: 38, fats: 19, category: "desserts" },
      { name: "Blueberry Muffin", nameAr: "مافن توت", calories: 380, protein: 5, carbs: 52, fats: 17, category: "desserts" },
    ]
  },
  {
    name: "Dr Cafe",
    nameAr: "دكتور كافيه",
    logo: null,
    category: "coffee",
    menu: [
      { name: "Signature Latte", nameAr: "لاتيه مميز", calories: 180, protein: 10, carbs: 20, fats: 6, category: "drinks" },
      { name: "Spanish Latte", nameAr: "سبانش لاتيه", calories: 220, protein: 8, carbs: 28, fats: 9, category: "drinks" },
      { name: "Flat White", nameAr: "فلات وايت", calories: 120, protein: 8, carbs: 10, fats: 5, category: "drinks" },
      { name: "Iced Coffee", nameAr: "قهوة مثلجة", calories: 100, protein: 2, carbs: 18, fats: 2, category: "drinks" },
      { name: "Cheesecake", nameAr: "تشيز كيك", calories: 420, protein: 6, carbs: 35, fats: 28, category: "desserts" },
    ]
  },
  {
    name: "Shawarmer",
    nameAr: "شاورمر",
    logo: null,
    category: "fast_food",
    menu: [
      { name: "Chicken Shawarma Wrap", nameAr: "شاورما دجاج لفة", calories: 380, protein: 24, carbs: 32, fats: 18, category: "main" },
      { name: "Beef Shawarma Wrap", nameAr: "شاورما لحم لفة", calories: 420, protein: 26, carbs: 30, fats: 22, category: "main" },
      { name: "Shawarma Plate", nameAr: "طبق شاورما", calories: 650, protein: 40, carbs: 55, fats: 30, category: "main" },
      { name: "Chicken Shawarma (Sandwich)", nameAr: "شاورما دجاج (ساندوتش)", calories: 320, protein: 20, carbs: 28, fats: 14, category: "main" },
      { name: "Fries", nameAr: "بطاطس", calories: 240, protein: 3, carbs: 32, fats: 11, category: "sides" },
      { name: "Garlic Sauce", nameAr: "صوص ثوم", calories: 80, protein: 0, carbs: 2, fats: 8, category: "sides" },
    ]
  },
  {
    name: "Healthy Corner",
    nameAr: "الركن الصحي",
    logo: null,
    category: "healthy",
    menu: [
      { name: "Grilled Chicken Salad", nameAr: "سلطة دجاج مشوي", calories: 320, protein: 35, carbs: 15, fats: 14, category: "main" },
      { name: "Quinoa Bowl", nameAr: "طبق كينوا", calories: 380, protein: 14, carbs: 52, fats: 12, category: "main" },
      { name: "Protein Wrap", nameAr: "راب بروتين", calories: 420, protein: 38, carbs: 28, fats: 18, category: "main" },
      { name: "Salmon Salad", nameAr: "سلطة سلمون", calories: 380, protein: 32, carbs: 12, fats: 22, category: "main" },
      { name: "Greek Salad", nameAr: "سلطة يونانية", calories: 220, protein: 8, carbs: 14, fats: 16, category: "sides" },
      { name: "Avocado Toast", nameAr: "توست أفوكادو", calories: 280, protein: 8, carbs: 28, fats: 16, category: "main" },
      { name: "Green Smoothie", nameAr: "سموذي أخضر", calories: 180, protein: 5, carbs: 35, fats: 3, category: "drinks" },
      { name: "Protein Smoothie", nameAr: "سموذي بروتين", calories: 320, protein: 28, carbs: 32, fats: 8, category: "drinks" },
    ]
  },
  {
    name: "Firegrill",
    nameAr: "فاير جريل",
    logo: null,
    category: "healthy",
    menu: [
      { name: "Grilled Chicken Breast", nameAr: "صدر دجاج مشوي", calories: 280, protein: 42, carbs: 5, fats: 10, category: "main" },
      { name: "Grilled Salmon", nameAr: "سلمون مشوي", calories: 350, protein: 38, carbs: 2, fats: 20, category: "main" },
      { name: "Steak (200g)", nameAr: "ستيك (200 غرام)", calories: 450, protein: 48, carbs: 0, fats: 28, category: "main" },
      { name: "Grilled Vegetables", nameAr: "خضار مشوية", calories: 120, protein: 4, carbs: 18, fats: 5, category: "sides" },
      { name: "Brown Rice", nameAr: "أرز بني", calories: 180, protein: 4, carbs: 38, fats: 2, category: "sides" },
      { name: "Sweet Potato", nameAr: "بطاطا حلوة", calories: 150, protein: 2, carbs: 35, fats: 0, category: "sides" },
    ]
  }
];

export async function seedRestaurants() {
  console.log("Seeding restaurants...");
  
  // Check if already seeded
  const existing = await db.select().from(restaurants);
  if (existing.length > 0) {
    console.log("Restaurants already seeded, skipping...");
    return;
  }

  for (const restaurant of saudiRestaurants) {
    const [inserted] = await db.insert(restaurants).values({
      name: restaurant.name,
      nameAr: restaurant.nameAr,
      logo: restaurant.logo,
      category: restaurant.category,
    }).returning();

    for (const item of restaurant.menu) {
      await db.insert(menuItems).values({
        restaurantId: inserted.id,
        name: item.name,
        nameAr: item.nameAr,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fats: item.fats,
        category: item.category,
      });
    }
    
    console.log(`Seeded ${restaurant.nameAr} with ${restaurant.menu.length} items`);
  }
  
  console.log("Restaurant seeding complete!");
}
