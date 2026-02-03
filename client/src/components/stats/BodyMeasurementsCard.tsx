import { useState } from "react";
import { useBodyMeasurements, useCreateBodyMeasurement } from "@/hooks/use-body-measurements";
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
import { Ruler, Plus, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export function BodyMeasurementsCard() {
  const { data: measurements, isLoading } = useBodyMeasurements();
  const createMeasurement = useCreateBodyMeasurement();
  const [open, setOpen] = useState(false);
  
  const [waist, setWaist] = useState("");
  const [chest, setChest] = useState("");
  const [arm, setArm] = useState("");
  const [hips, setHips] = useState("");
  const [bodyFat, setBodyFat] = useState("");

  const handleSubmit = async () => {
    await createMeasurement.mutateAsync({
      waist: waist ? parseInt(waist) : undefined,
      chest: chest ? parseInt(chest) : undefined,
      arm: arm ? parseInt(arm) : undefined,
      hips: hips ? parseInt(hips) : undefined,
      bodyFat: bodyFat ? Math.round(parseFloat(bodyFat) * 10) : undefined,
    });
    setOpen(false);
    setWaist("");
    setChest("");
    setArm("");
    setHips("");
    setBodyFat("");
  };

  const latest = measurements?.[0];
  const previous = measurements?.[1];

  const getDiff = (current?: number | null, prev?: number | null) => {
    if (!current || !prev) return null;
    return current - prev;
  };

  const measurementItems = [
    { label: "الخصر", value: latest?.waist, prev: previous?.waist, unit: "سم" },
    { label: "الصدر", value: latest?.chest, prev: previous?.chest, unit: "سم" },
    { label: "الذراع", value: latest?.arm, prev: previous?.arm, unit: "سم" },
    { label: "الورك", value: latest?.hips, prev: previous?.hips, unit: "سم" },
    { label: "نسبة الدهون", value: latest?.bodyFat ? latest.bodyFat / 10 : null, prev: previous?.bodyFat ? previous.bodyFat / 10 : null, unit: "%" },
  ];

  if (isLoading) {
    return (
      <Card className="p-4 border-0 shadow-sm">
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 border-0 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Ruler className="w-5 h-5 text-primary" />
          قياسات الجسم
        </h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost" data-testid="button-add-measurement">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة قياسات جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الخصر (سم)</Label>
                  <Input
                    type="number"
                    value={waist}
                    onChange={(e) => setWaist(e.target.value)}
                    placeholder="75"
                    data-testid="input-waist"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الصدر (سم)</Label>
                  <Input
                    type="number"
                    value={chest}
                    onChange={(e) => setChest(e.target.value)}
                    placeholder="100"
                    data-testid="input-chest"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الذراع (سم)</Label>
                  <Input
                    type="number"
                    value={arm}
                    onChange={(e) => setArm(e.target.value)}
                    placeholder="35"
                    data-testid="input-arm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الورك (سم)</Label>
                  <Input
                    type="number"
                    value={hips}
                    onChange={(e) => setHips(e.target.value)}
                    placeholder="95"
                    data-testid="input-hips"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>نسبة الدهون (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={bodyFat}
                  onChange={(e) => setBodyFat(e.target.value)}
                  placeholder="15.5"
                  data-testid="input-body-fat"
                />
              </div>
              <Button 
                onClick={handleSubmit} 
                className="w-full"
                disabled={createMeasurement.isPending}
                data-testid="button-save-measurement"
              >
                {createMeasurement.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "حفظ القياسات"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {latest ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            آخر قياس: {format(new Date(latest.date), "d MMMM yyyy", { locale: ar })}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {measurementItems.map((item) => {
              if (!item.value) return null;
              const diff = getDiff(item.value, item.prev);
              return (
                <div key={item.label} className="bg-muted/50 p-3 rounded-xl">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{item.value}</span>
                    <span className="text-sm text-muted-foreground">{item.unit}</span>
                    {diff !== null && diff !== 0 && (
                      <span className={`text-xs flex items-center ${diff < 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {diff < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                        {Math.abs(diff).toFixed(item.unit === '%' ? 1 : 0)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <Ruler className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>لا توجد قياسات</p>
          <p className="text-sm">اضغط + لإضافة قياساتك</p>
        </div>
      )}
    </Card>
  );
}
