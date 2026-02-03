import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, X, Camera, ScanBarcode } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useCreateMeal } from "@/hooks/use-meals";
import { apiRequest } from "@/lib/queryClient";

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProductInfo {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  servingSize?: string;
}

export function BarcodeScanner({ open, onOpenChange }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { toast } = useToast();
  const createMeal = useCreateMeal();

  useEffect(() => {
    if (open && !isScanning && !productInfo) {
      startScanner();
    }
    
    return () => {
      stopScanner();
    };
  }, [open]);

  const startScanner = async () => {
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
        onScanSuccess,
        () => {}
      );
    } catch (error) {
      console.error("Scanner error:", error);
      toast({
        title: "خطأ",
        description: "تعذر الوصول للكاميرا",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (error) {
        console.error("Stop scanner error:", error);
      }
    }
    setIsScanning(false);
  };

  const onScanSuccess = async (barcode: string) => {
    await stopScanner();
    setIsLoading(true);

    try {
      const response = await apiRequest("GET", `/api/barcode/${barcode}`);
      const result = await response.json();

      if (result.success && result.product) {
        setProductInfo(result.product);
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

  const handleAddMeal = async () => {
    if (!productInfo) return;

    try {
      await createMeal.mutateAsync({
        name: productInfo.name,
        calories: productInfo.calories,
        protein: productInfo.protein,
        carbs: productInfo.carbs,
        fats: productInfo.fats,
      });
      toast({
        title: "تمت الإضافة",
        description: `تم إضافة ${productInfo.name} إلى وجباتك`,
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

  const handleClose = () => {
    stopScanner();
    setProductInfo(null);
    onOpenChange(false);
  };

  const handleRetry = () => {
    setProductInfo(null);
    startScanner();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden" dir="rtl">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <ScanBarcode className="w-5 h-5" />
            مسح الباركود
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">جاري البحث عن المنتج...</p>
            </div>
          ) : productInfo ? (
            <div className="space-y-4">
              <div className="text-center py-2">
                <h3 className="text-xl font-bold">{productInfo.name}</h3>
                {productInfo.servingSize && (
                  <p className="text-sm text-muted-foreground">{productInfo.servingSize}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary/10 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{productInfo.calories}</p>
                  <p className="text-xs text-muted-foreground">سعرة حرارية</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{productInfo.protein}g</p>
                  <p className="text-xs text-muted-foreground">بروتين</p>
                </div>
                <div className="bg-orange-100 dark:bg-orange-900/30 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-orange-600">{productInfo.carbs}g</p>
                  <p className="text-xs text-muted-foreground">كربوهيدرات</p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/30 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-purple-600">{productInfo.fats}g</p>
                  <p className="text-xs text-muted-foreground">دهون</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleRetry}
                  data-testid="button-barcode-retry"
                >
                  مسح آخر
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-primary to-emerald-500"
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
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div 
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
