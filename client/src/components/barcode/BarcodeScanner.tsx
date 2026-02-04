import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ScanBarcode, Pencil, Bookmark, Check, Sun, CloudSun, Moon, Cookie } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useCreateMeal } from "@/hooks/use-meals";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const mealCategories: { key: MealCategory; label: string; icon: any; gradient: string }[] = [
  { key: 'breakfast', label: 'الفطور', icon: Sun, gradient: 'from-amber-400 to-orange-500' },
  { key: 'lunch', label: 'الغداء', icon: CloudSun, gradient: 'from-orange-500 to-red-500' },
  { key: 'dinner', label: 'العشاء', icon: Moon, gradient: 'from-purple-500 to-violet-600' },
  { key: 'snack', label: 'وجبات خفيفة', icon: Cookie, gradient: 'from-cyan-400 to-blue-500' },
];

interface ProductInfo {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize?: string;
  barcode?: string;
}

export function BarcodeScanner({ open, onOpenChange }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [scannerReady, setScannerReady] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState<ProductInfo | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealCategory>("lunch");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { toast } = useToast();
  const createMeal = useCreateMeal();

  const saveFoodMutation = useMutation({
    mutationFn: async (food: ProductInfo) => {
      const response = await apiRequest("POST", "/api/saved-foods", {
        name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fats: food.fats,
        barcode: food.barcode || null,
        source: "barcode",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-foods"] });
      toast({
        title: "تم الحفظ",
        description: "تم حفظ المنتج في المحفوظات",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في حفظ المنتج",
        variant: "destructive",
      });
    },
  });

  const startScanner = useCallback(async () => {
    if (isScanning) return;
    
    const container = document.getElementById("barcode-reader");
    if (!container) return;
    
    try {
      setIsScanning(true);
      const scanner = new Html5Qrcode("barcode-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
        },
        async (barcode: string) => {
          await stopScanner();
          await lookupBarcode(barcode);
        },
        () => {}
      );
    } catch (error: any) {
      console.error("Scanner error:", error);
      const errorMessage = error?.message || String(error);
      
      if (errorMessage.includes("Permission denied") || errorMessage.includes("NotAllowedError")) {
        toast({
          title: "صلاحية الكاميرا مطلوبة",
          description: "يرجى السماح بالوصول للكاميرا من إعدادات المتصفح",
          variant: "destructive",
        });
      } else if (errorMessage.includes("NotFoundError") || errorMessage.includes("No camera")) {
        toast({
          title: "لا توجد كاميرا",
          description: "لم يتم العثور على كاميرا متصلة بجهازك",
          variant: "destructive",
        });
      } else {
        toast({
          title: "خطأ في الكاميرا",
          description: "تعذر تشغيل الكاميرا. جرب مرة أخرى.",
          variant: "destructive",
        });
      }
      setIsScanning(false);
    }
  }, [isScanning, toast]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) {
          await scannerRef.current.stop();
        }
        scannerRef.current = null;
      } catch (error) {
        console.error("Stop scanner error:", error);
      }
    }
    setIsScanning(false);
  };

  const lookupBarcode = async (barcode: string) => {
    setIsLoading(true);

    try {
      const response = await apiRequest("GET", `/api/barcode/${barcode}`);
      const result = await response.json();

      if (result.success && result.product) {
        const product = { ...result.product, barcode };
        setProductInfo(product);
        setEditedProduct(product);
      } else {
        toast({
          title: "المنتج غير موجود",
          description: "لم نتمكن من العثور على معلومات هذا المنتج",
          variant: "destructive",
        });
        handleClose();
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في البحث عن المنتج",
        variant: "destructive",
      });
      handleClose();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && scannerReady && !isScanning && !productInfo && !isLoading) {
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open, scannerReady, isScanning, productInfo, isLoading, startScanner]);

  useEffect(() => {
    if (!open) {
      stopScanner();
      setScannerReady(false);
      setIsEditing(false);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const currentProduct = isEditing ? editedProduct : productInfo;

  const handleAddMeal = async () => {
    if (!currentProduct) return;

    try {
      const mealTypeLabel = mealCategories.find(c => c.key === selectedMealType)?.label || "";
      await createMeal.mutateAsync({
        name: currentProduct.name,
        calories: currentProduct.calories,
        protein: currentProduct.protein,
        carbs: currentProduct.carbs,
        fats: currentProduct.fats,
        mealType: selectedMealType,
      });
      toast({
        title: "تمت الإضافة",
        description: `تم إضافة ${currentProduct.name} في ${mealTypeLabel}`,
      });
      handleClose();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إضافة الوجبة",
        variant: "destructive",
      });
    }
  };

  const handleSaveToFavorites = async () => {
    if (!currentProduct) return;
    await saveFoodMutation.mutateAsync(currentProduct);
  };

  const handleClose = () => {
    stopScanner();
    setProductInfo(null);
    setEditedProduct(null);
    setScannerReady(false);
    setIsEditing(false);
    setSelectedMealType("lunch");
    onOpenChange(false);
  };

  const handleRetry = () => {
    setProductInfo(null);
    setEditedProduct(null);
    setIsEditing(false);
    setScannerReady(true);
  };

  const handleEditToggle = () => {
    if (isEditing && editedProduct) {
      setProductInfo(editedProduct);
    }
    setIsEditing(!isEditing);
  };

  const handleContainerMount = useCallback((node: HTMLDivElement | null) => {
    if (node && open) {
      setScannerReady(true);
    }
  }, [open]);

  const updateEditedField = (field: keyof ProductInfo, value: string | number) => {
    if (!editedProduct) return;
    setEditedProduct({
      ...editedProduct,
      [field]: typeof value === "string" && field !== "name" ? parseInt(value) || 0 : value,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden" dir="rtl">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <ScanBarcode className="w-5 h-5" />
            مسح الباركود
          </DialogTitle>
          <DialogDescription className="sr-only">
            مسح الباركود للبحث عن معلومات المنتج الغذائية
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 pb-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">جاري البحث عن المنتج...</p>
            </div>
          ) : productInfo ? (
            <div className="space-y-4">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="edit-name">اسم المنتج</Label>
                    <Input
                      id="edit-name"
                      value={editedProduct?.name || ""}
                      onChange={(e) => updateEditedField("name", e.target.value)}
                      className="text-right"
                      data-testid="input-edit-name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="edit-calories">السعرات</Label>
                      <Input
                        id="edit-calories"
                        type="number"
                        value={editedProduct?.calories || 0}
                        onChange={(e) => updateEditedField("calories", e.target.value)}
                        className="text-center"
                        data-testid="input-edit-calories"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-protein">البروتين (g)</Label>
                      <Input
                        id="edit-protein"
                        type="number"
                        value={editedProduct?.protein || 0}
                        onChange={(e) => updateEditedField("protein", e.target.value)}
                        className="text-center"
                        data-testid="input-edit-protein"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-carbs">الكربوهيدرات (g)</Label>
                      <Input
                        id="edit-carbs"
                        type="number"
                        value={editedProduct?.carbs || 0}
                        onChange={(e) => updateEditedField("carbs", e.target.value)}
                        className="text-center"
                        data-testid="input-edit-carbs"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-fats">الدهون (g)</Label>
                      <Input
                        id="edit-fats"
                        type="number"
                        value={editedProduct?.fats || 0}
                        onChange={(e) => updateEditedField("fats", e.target.value)}
                        className="text-center"
                        data-testid="input-edit-fats"
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleEditToggle}
                    data-testid="button-save-edit"
                  >
                    <Check className="w-4 h-4 ml-2" />
                    حفظ التعديلات
                  </Button>
                </div>
              ) : (
                <>
                  <div className="text-center py-2">
                    <h3 className="text-xl font-bold">{currentProduct?.name}</h3>
                    {productInfo.servingSize && (
                      <p className="text-sm text-muted-foreground">{productInfo.servingSize}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-primary/10 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-primary">{currentProduct?.calories}</p>
                      <p className="text-xs text-muted-foreground">سعرة حرارية</p>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900/30 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-green-600">{currentProduct?.protein}g</p>
                      <p className="text-xs text-muted-foreground">بروتين</p>
                    </div>
                    <div className="bg-orange-100 dark:bg-orange-900/30 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-orange-600">{currentProduct?.carbs}g</p>
                      <p className="text-xs text-muted-foreground">كربوهيدرات</p>
                    </div>
                    <div className="bg-purple-100 dark:bg-purple-900/30 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-purple-600">{currentProduct?.fats}g</p>
                      <p className="text-xs text-muted-foreground">دهون</p>
                    </div>
                  </div>

                  {/* Meal Type Selector */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-center">اختر نوع الوجبة</p>
                    <div className="grid grid-cols-4 gap-2">
                      {mealCategories.map((type) => {
                        const Icon = type.icon;
                        const isSelected = selectedMealType === type.key;
                        return (
                          <button
                            key={type.key}
                            type="button"
                            onClick={() => setSelectedMealType(type.key)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                              isSelected 
                                ? `bg-gradient-to-br ${type.gradient} text-white shadow-lg scale-105` 
                                : "bg-muted hover:bg-muted/80"
                            }`}
                            data-testid={`button-barcode-meal-type-${type.key}`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-xs font-medium">{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleEditToggle}
                      data-testid="button-edit-product"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleSaveToFavorites}
                      disabled={saveFoodMutation.isPending}
                      data-testid="button-save-favorite"
                    >
                      {saveFoodMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleRetry}
                      data-testid="button-barcode-retry"
                    >
                      مسح آخر
                    </Button>
                  </div>
                </>
              )}

              {!isEditing && (
                <Button
                  className="w-full bg-gradient-to-r from-primary to-emerald-500"
                  onClick={handleAddMeal}
                  disabled={createMeal.isPending}
                  data-testid="button-barcode-add"
                >
                  {createMeal.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "إضافة الوجبة"
                  )}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div 
                ref={handleContainerMount}
                id="barcode-reader" 
                className="w-full rounded-xl overflow-hidden bg-black"
                style={{ minHeight: "250px" }}
              />
              <p className="text-center text-sm text-muted-foreground">
                وجّه الكاميرا نحو الباركود
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
