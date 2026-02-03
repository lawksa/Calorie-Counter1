import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  User,
  Flame,
  ChartLine,
  Dumbbell,
  UtensilsCrossed,
  Plus,
  X,
  Camera,
  ScanBarcode,
  PenLine
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface AppLayoutProps {
  children: React.ReactNode;
  onManualAdd?: () => void;
  onCameraAdd?: () => void;
}

export function AppLayout({ children, onManualAdd, onCameraAdd }: AppLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const navItems = [
    { label: "الرئيسية", href: "/", icon: LayoutDashboard },
    { label: "المطاعم", href: "/restaurants", icon: UtensilsCrossed },
    { label: "add", href: null, icon: Plus, isAddButton: true },
    { label: "التمارين", href: "/exercises", icon: Dumbbell },
    { label: "الإحصائيات", href: "/stats", icon: ChartLine },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">السعرات الحرارية</h1>
              <p className="text-xs text-muted-foreground">مرحباً، {user?.firstName || "مستخدم"}</p>
            </div>
          </div>
          
          <Link href="/settings">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-lg mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      {/* Bottom Navigation - Appetit Style */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t pb-safe">
        <div className="max-w-lg mx-auto flex items-center justify-around py-1">
          {navItems.map((item) => {
            if (item.isAddButton) {
              return (
                <div key="add-button" className="relative">
                  <AnimatePresence>
                    {isAddMenuOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40"
                          onClick={() => setIsAddMenuOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col gap-3 items-center z-50"
                        >
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1, transition: { delay: 0.1 } }}
                            className="flex items-center gap-3"
                          >
                            <span className="bg-background/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium shadow-lg whitespace-nowrap">
                              تحليل صورة
                            </span>
                            <button
                              className="w-12 h-12 rounded-full shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center"
                              onClick={() => {
                                setIsAddMenuOpen(false);
                                onCameraAdd?.();
                              }}
                              data-testid="button-add-camera"
                            >
                              <Camera className="w-5 h-5 text-white" />
                            </button>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1, transition: { delay: 0.05 } }}
                            className="flex items-center gap-3"
                          >
                            <span className="bg-background/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium shadow-lg whitespace-nowrap">
                              مسح الباركود
                            </span>
                            <button
                              className="w-12 h-12 rounded-full shadow-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
                              onClick={() => {
                                setIsAddMenuOpen(false);
                              }}
                              data-testid="button-add-barcode"
                            >
                              <ScanBarcode className="w-5 h-5 text-white" />
                            </button>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-3"
                          >
                            <span className="bg-background/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium shadow-lg whitespace-nowrap">
                              إضافة يدوية
                            </span>
                            <button
                              className="w-12 h-12 rounded-full shadow-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center"
                              onClick={() => {
                                setIsAddMenuOpen(false);
                                onManualAdd?.();
                              }}
                              data-testid="button-add-manual"
                            >
                              <PenLine className="w-5 h-5 text-white" />
                            </button>
                          </motion.div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                  <button
                    onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                    className="flex flex-col items-center gap-0.5 px-2 py-2"
                    data-testid="button-nav-add"
                  >
                    <div className={cn(
                      "w-12 h-12 -mt-6 rounded-full flex items-center justify-center shadow-lg transition-all duration-300",
                      isAddMenuOpen 
                        ? "bg-muted rotate-45" 
                        : "bg-gradient-to-br from-primary to-emerald-500"
                    )}>
                      <Plus className={cn(
                        "w-6 h-6 transition-colors",
                        isAddMenuOpen ? "text-foreground" : "text-white"
                      )} />
                    </div>
                  </button>
                </div>
              );
            }
            
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href!}>
                <div className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all duration-300",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground"
                )}>
                  <item.icon className={cn(
                    "w-5 h-5 transition-transform duration-300",
                    isActive && "scale-110"
                  )} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
