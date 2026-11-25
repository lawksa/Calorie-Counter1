import { Button } from "@/components/ui/button";
import { Flame, ArrowLeft, Sparkles, Target, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      {/* Hero Section - Full Screen */}
      <div className="min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="p-4">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">السعرات</span>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
          <motion.div 
            className="text-center max-w-md"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Decorative Ring */}
            <div className="relative w-48 h-48 mx-auto mb-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r="85"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="12"
                />
                <motion.circle
                  cx="100"
                  cy="100"
                  r="85"
                  fill="none"
                  stroke="url(#heroGradient)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray="534"
                  initial={{ strokeDashoffset: 534 }}
                  animate={{ strokeDashoffset: 134 }}
                  transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(158 64% 52%)" />
                    <stop offset="100%" stopColor="hsl(142 71% 45%)" />
                  </linearGradient>
                </defs>
              </svg>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span 
                  className="text-4xl font-bold"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  1,850
                </motion.span>
                <span className="text-sm text-muted-foreground">سعرة متبقية</span>
              </div>
            </div>

            <h1 className="text-3xl font-bold mb-4 leading-tight">
              تتبع سعراتك الحرارية
              <br />
              <span className="text-primary">بذكاء اصطناعي</span>
            </h1>
            
            <p className="text-muted-foreground mb-8 leading-relaxed">
              احسب السعرات الحرارية والعناصر الغذائية بسهولة. فقط أخبرنا ماذا أكلت وسنحسب لك كل شيء.
            </p>

            <a href="/api/login">
              <Button 
                size="lg" 
                className="h-14 px-10 text-lg rounded-2xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all bg-gradient-to-r from-primary to-emerald-500"
              >
                ابدأ الآن مجاناً
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </a>
          </motion.div>
        </div>

        {/* Features */}
        <div className="px-6 pb-12">
          <div className="max-w-lg mx-auto grid grid-cols-3 gap-4">
            <FeatureItem 
              icon={<Sparkles className="w-5 h-5 text-purple-500" />}
              label="تحليل ذكي"
            />
            <FeatureItem 
              icon={<Target className="w-5 h-5 text-primary" />}
              label="تتبع أهدافك"
            />
            <FeatureItem 
              icon={<ShieldCheck className="w-5 h-5 text-blue-500" />}
              label="آمن وخاص"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <motion.div 
      className="flex flex-col items-center gap-2 p-4 bg-card rounded-2xl border shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
        {icon}
      </div>
      <span className="text-sm font-medium text-center">{label}</span>
    </motion.div>
  );
}
