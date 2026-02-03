import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  Watch, 
  Smartphone, 
  Heart, 
  Footprints, 
  Flame, 
  Moon, 
  Scale,
  Shield,
  Bell,
  CheckCircle2,
  Clock,
  Sparkles
} from "lucide-react";

const healthFeatures = [
  { icon: Footprints, label: "عدد الخطوات", description: "تتبع خطواتك اليومية تلقائياً" },
  { icon: Flame, label: "السعرات المحروقة", description: "حساب دقيق للسعرات المحروقة" },
  { icon: Heart, label: "معدل نبض القلب", description: "مراقبة صحة القلب" },
  { icon: Clock, label: "مدة التمارين", description: "تسجيل تلقائي للتمارين" },
  { icon: Scale, label: "الوزن", description: "مزامنة بيانات الوزن" },
  { icon: Moon, label: "بيانات النوم", description: "تتبع جودة النوم" },
];

const supportedDevices = [
  { name: "Apple Watch", platform: "iOS" },
  { name: "Samsung Galaxy Watch", platform: "Android" },
  { name: "Garmin", platform: "iOS / Android" },
  { name: "Fitbit", platform: "iOS / Android" },
  { name: "Huawei Watch", platform: "Android" },
  { name: "Xiaomi Mi Band", platform: "Android" },
];

export default function HealthConnect() {
  return (
    <AppLayout>
      <div className="space-y-6 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center space-y-4"
        >
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-lg">
            <Watch className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">ربط الساعات الذكية</h1>
            <p className="text-muted-foreground mt-2">مزامنة بياناتك الصحية تلقائياً</p>
          </div>
        </motion.div>

        {/* Coming Soon Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="p-6 border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-amber-900 dark:text-amber-100">ميزة قادمة قريباً</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  نعمل على إضافة ربط Apple Health و Google Health Connect في التحديث القادم
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="p-5 border-0 shadow-md">
            <h3 className="font-bold text-lg mb-4">كيف سيعمل الربط؟</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900 dark:text-blue-100">Apple Health (iOS)</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    لمستخدمي iPhone و Apple Watch - يتم قراءة البيانات من تطبيق صحتي
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-green-50 dark:bg-green-950/30 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-bold text-green-900 dark:text-green-100">Google Health Connect (Android)</h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    لمستخدمي Android - يدعم Samsung Health و Fitbit و Garmin وغيرها
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="p-5 border-0 shadow-md">
            <h3 className="font-bold text-lg mb-4">البيانات المدعومة</h3>
            <div className="grid grid-cols-2 gap-3">
              {healthFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{feature.label}</p>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Supported Devices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="p-5 border-0 shadow-md">
            <h3 className="font-bold text-lg mb-4">الأجهزة المدعومة</h3>
            <div className="grid grid-cols-2 gap-2">
              {supportedDevices.map((device, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                  <Watch className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{device.name}</p>
                    <p className="text-xs text-muted-foreground">{device.platform}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Privacy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="p-5 border-0 shadow-md bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-bold text-lg text-purple-900 dark:text-purple-100">الخصوصية والأمان</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  البيانات تُستخدم فقط لتحسين حساباتك الغذائية
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  لا يتم بيع أو مشاركة أي بيانات مع أطراف خارجية
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  جميع البيانات تبقى على جهازك فقط
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  يمكنك إلغاء الربط في أي وقت
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Notify Me Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <Button 
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-emerald-500 rounded-2xl shadow-lg"
            disabled
          >
            <Bell className="w-5 h-5 ml-2" />
            سيتم إشعارك عند توفر الميزة
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-3">
            الميزة قيد التطوير وستكون متاحة في تحديث قادم
          </p>
        </motion.div>
      </div>
    </AppLayout>
  );
}
