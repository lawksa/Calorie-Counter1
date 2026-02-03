import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  X, 
  Camera, 
  ScanBarcode, 
  PenLine,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useCreateMeal } from "@/hooks/use-meals";
import { apiRequest } from "@/lib/queryClient";

interface FloatingAddButtonProps {
  onManualAdd: () => void;
}

export function FloatingAddButton({ onManualAdd }: FloatingAddButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const createMeal = useCreateMeal();

  const menuItems = [
    { 
      icon: Camera, 
      label: "تحليل صورة الوجبة", 
      testId: "button-add-camera",
      color: "from-blue-500 to-cyan-500",
      action: () => {
        fileInputRef.current?.click();
        setIsOpen(false);
      }
    },
    { 
      icon: ScanBarcode, 
      label: "مسح الباركود", 
      testId: "button-add-barcode",
      color: "from-purple-500 to-pink-500",
      action: () => {
        toast({
          title: "قريباً",
          description: "ميزة مسح الباركود ستكون متاحة قريباً",
        });
        setIsOpen(false);
      }
    },
    { 
      icon: PenLine, 
      label: "إضافة يدوية", 
      testId: "button-add-manual",
      color: "from-green-500 to-emerald-500",
      action: () => {
        onManualAdd();
        setIsOpen(false);
      }
    },
  ];

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await apiRequest("POST", "/api/analyze-meal-image", { 
        image: base64 
      });
      const result = await response.json();
      
      if (result.success && result.meal) {
        setAnalysisResult(result.meal);
        setShowResultDialog(true);
      } else {
        toast({
          title: "تعذر التحليل",
          description: result.error || "لم نتمكن من تحليل الصورة، حاول مجدداً",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحليل الصورة",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAddAnalyzedMeal = async () => {
    if (!analysisResult) return;

    try {
      await createMeal.mutateAsync({
        name: analysisResult.name,
        calories: analysisResult.calories,
        protein: analysisResult.protein,
        carbs: analysisResult.carbs,
        fats: analysisResult.fats,
      });
      toast({
        title: "تمت الإضافة",
        description: `تم إضافة ${analysisResult.name} إلى وجباتك`,
      });
      setShowResultDialog(false);
      setAnalysisResult(null);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إضافة الوجبة",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleImageSelect}
        data-testid="input-camera-capture"
      />

      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col gap-3 items-center"
            >
              {menuItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    y: 0,
                    transition: { delay: index * 0.05 }
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.8, 
                    y: 20,
                    transition: { delay: (menuItems.length - index) * 0.03 }
                  }}
                  className="flex items-center gap-3"
                >
                  <span className="bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium shadow-lg whitespace-nowrap">
                    {item.label}
                  </span>
                  <button
                    className={cn(
                      "w-12 h-12 rounded-full shadow-lg bg-gradient-to-br flex items-center justify-center",
                      item.color
                    )}
                    onClick={item.action}
                    data-testid={item.testId}
                  >
                    <item.icon className="w-5 h-5 text-white" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300",
            isOpen 
              ? "bg-muted rotate-45" 
              : "bg-gradient-to-br from-primary to-emerald-500"
          )}
          data-testid="button-floating-add"
        >
          {isAnalyzing ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Plus className={cn(
              "w-6 h-6 transition-transform duration-300",
              isOpen ? "text-foreground" : "text-white"
            )} />
          )}
        </motion.button>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-[400px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>نتيجة التحليل</DialogTitle>
          </DialogHeader>
          
          {analysisResult && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-bold">{analysisResult.name}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary/10 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{analysisResult.calories}</p>
                  <p className="text-xs text-muted-foreground">سعرة حرارية</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{analysisResult.protein}g</p>
                  <p className="text-xs text-muted-foreground">بروتين</p>
                </div>
                <div className="bg-orange-100 dark:bg-orange-900/30 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-orange-600">{analysisResult.carbs}g</p>
                  <p className="text-xs text-muted-foreground">كربوهيدرات</p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/30 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-purple-600">{analysisResult.fats}g</p>
                  <p className="text-xs text-muted-foreground">دهون</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowResultDialog(false)}
                  data-testid="button-cancel-analysis"
                >
                  إلغاء
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-primary to-emerald-500"
                  onClick={handleAddAnalyzedMeal}
                  disabled={createMeal.isPending}
                  data-testid="button-confirm-analysis"
                >
                  {createMeal.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "إضافة الوجبة"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
