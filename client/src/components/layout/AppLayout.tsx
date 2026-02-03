import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  User,
  Flame,
  ChartLine,
  Dumbbell,
  UtensilsCrossed,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
  onAddClick?: () => void;
}

export function AppLayout({ children, onAddClick }: AppLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();

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
                <button
                  key="add-button"
                  onClick={onAddClick}
                  className="flex flex-col items-center gap-0.5 px-2 py-2"
                  data-testid="button-nav-add"
                >
                  <div className="w-12 h-12 -mt-6 rounded-full bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-lg">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                </button>
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
