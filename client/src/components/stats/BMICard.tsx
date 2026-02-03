import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  User, 
  Ruler, 
  Target,
  Edit2,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";

interface BMICardProps {
  height: number | null;
  currentWeight: number | null;
  targetWeight: number | null;
  onUpdate: (data: { height?: number; targetWeight?: number }) => Promise<void>;
}

function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function getBMICategory(bmi: number): { label: string; color: string; bgColor: string } {
  if (bmi < 18.5) return { label: "نحيف", color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" };
  if (bmi < 25) return { label: "طبيعي", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" };
  if (bmi < 30) return { label: "زيادة وزن", color: "text-yellow-600", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" };
  if (bmi < 35) return { label: "سمنة درجة 1", color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/30" };
  return { label: "سمنة شديدة", color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30" };
}

export function BMICard({ height, currentWeight, targetWeight, onUpdate }: BMICardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editHeight, setEditHeight] = useState(height?.toString() || "");
  const [editTargetWeight, setEditTargetWeight] = useState(targetWeight ? (targetWeight / 1000).toString() : "");
  const { toast } = useToast();

  const weightKg = currentWeight ? currentWeight / 1000 : null;
  const targetKg = targetWeight ? targetWeight / 1000 : null;
  const bmi = weightKg && height ? calculateBMI(weightKg, height) : null;
  const bmiCategory = bmi ? getBMICategory(bmi) : null;

  const weightDiff = weightKg && targetKg ? weightKg - targetKg : null;

  const handleSave = async () => {
    const heightNum = parseInt(editHeight);
    const targetNum = parseFloat(editTargetWeight);

    if (editHeight && (isNaN(heightNum) || heightNum < 100 || heightNum > 250)) {
      toast({ title: "خطأ", description: "أدخل طول صحيح (100-250 سم)", variant: "destructive" });
      return;
    }

    if (editTargetWeight && (isNaN(targetNum) || targetNum < 30 || targetNum > 300)) {
      toast({ title: "خطأ", description: "أدخل وزن مستهدف صحيح (30-300 كغ)", variant: "destructive" });
      return;
    }

    await onUpdate({
      height: editHeight ? heightNum : undefined,
      targetWeight: editTargetWeight ? Math.round(targetNum * 1000) : undefined,
    });

    setDialogOpen(false);
    toast({ title: "تم", description: "تم تحديث البيانات بنجاح" });
  };

  return (
    <Card className="p-5 border-0 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          ملف المستخدم
        </h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" data-testid="button-edit-profile">
              <Edit2 className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>تعديل البيانات الشخصية</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="height">الطول (سم)</Label>
                <Input
                  id="height"
                  type="number"
                  value={editHeight}
                  onChange={(e) => setEditHeight(e.target.value)}
                  placeholder="مثال: 170"
                  data-testid="input-height"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetWeight">الوزن المستهدف (كغ)</Label>
                <Input
                  id="targetWeight"
                  type="number"
                  step="0.1"
                  value={editTargetWeight}
                  onChange={(e) => setEditTargetWeight(e.target.value)}
                  placeholder="مثال: 70"
                  data-testid="input-target-weight"
                />
              </div>
              <Button onClick={handleSave} className="w-full" data-testid="button-save-profile">
                حفظ
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 rounded-xl bg-muted/50">
          <Ruler className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-xl font-bold">{height || "--"}</p>
          <p className="text-[10px] text-muted-foreground">سم</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-muted/50">
          <User className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-xl font-bold">{weightKg?.toFixed(1) || "--"}</p>
          <p className="text-[10px] text-muted-foreground">كغ</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-muted/50">
          <Target className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-xl font-bold">{targetKg?.toFixed(1) || "--"}</p>
          <p className="text-[10px] text-muted-foreground">الهدف</p>
        </div>
      </div>

      {bmi && bmiCategory && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-4 rounded-xl ${bmiCategory.bgColor}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">مؤشر كتلة الجسم (BMI)</p>
              <p className={`text-3xl font-bold ${bmiCategory.color}`}>{bmi.toFixed(1)}</p>
              <p className={`text-sm font-medium ${bmiCategory.color}`}>{bmiCategory.label}</p>
            </div>
            {weightDiff !== null && (
              <div className="text-left">
                <p className="text-xs text-muted-foreground">للوصول للهدف</p>
                <div className={`flex items-center gap-1 ${weightDiff > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {weightDiff > 0 ? (
                    <TrendingDown className="w-4 h-4" />
                  ) : (
                    <TrendingUp className="w-4 h-4" />
                  )}
                  <span className="text-lg font-bold">
                    {weightDiff > 0 ? `-${weightDiff.toFixed(1)}` : `+${Math.abs(weightDiff).toFixed(1)}`} كغ
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {(!height || !currentWeight) && (
        <div className="text-center p-4 bg-muted/30 rounded-xl">
          <p className="text-sm text-muted-foreground">
            أضف طولك ووزنك لحساب مؤشر كتلة الجسم
          </p>
        </div>
      )}
    </Card>
  );
}
