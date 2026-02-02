import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Flame, ArrowRight, Activity, Zap, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Flame className="w-6 h-6 fill-current" />
            <span className="font-display font-bold text-xl tracking-tight">CalorieTracker</span>
          </div>
          <a href="/api/login">
            <Button>Log In / Sign Up</Button>
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-foreground leading-[1.1] mb-6">
              Fuel Your Body, <br />
              <span className="text-primary">Reach Your Goals.</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-lg leading-relaxed">
              Effortlessly track calories and macros with AI-powered meal estimation. Health made simple.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="/api/login">
                <Button size="lg" className="h-12 px-8 text-lg rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                  Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
              <Button size="lg" variant="outline" className="h-12 px-8 text-lg rounded-full">
                View Demo
              </Button>
            </div>
            
            <div className="mt-12 flex items-center gap-8 text-sm text-muted-foreground font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-500" /> No Credit Card
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" /> Instant Analysis
              </div>
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-full blur-3xl -z-10 transform translate-y-12"></div>
            <div className="bg-card border rounded-3xl shadow-2xl p-6 relative z-10">
              {/* Fake Dashboard UI */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold">Today's Progress</h3>
                  <p className="text-sm text-muted-foreground">Oct 24, 2025</p>
                </div>
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">JD</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-muted/30 p-4 rounded-xl border">
                  <div className="text-sm text-muted-foreground mb-1">Calories Remaining</div>
                  <div className="text-2xl font-bold text-primary">840 <span className="text-sm font-normal text-muted-foreground">kcal</span></div>
                </div>
                <div className="bg-muted/30 p-4 rounded-xl border">
                  <div className="text-sm text-muted-foreground mb-1">Protein Goal</div>
                  <div className="text-2xl font-bold text-orange-500">120g <span className="text-sm font-normal text-muted-foreground">/ 150g</span></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-background p-3 rounded-lg border flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-700">🥗</div>
                    <div>
                      <div className="font-semibold">Chicken Caesar Salad</div>
                      <div className="text-xs text-muted-foreground">Lunch • 12:30 PM</div>
                    </div>
                  </div>
                  <div className="font-bold">450 kcal</div>
                </div>
                <div className="bg-background p-3 rounded-lg border flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-700">🍳</div>
                    <div>
                      <div className="font-semibold">Oatmeal & Berries</div>
                      <div className="text-xs text-muted-foreground">Breakfast • 8:00 AM</div>
                    </div>
                  </div>
                  <div className="font-bold">320 kcal</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-display font-bold mb-4">Everything you need to succeed</h2>
            <p className="text-muted-foreground">Powerful features wrapped in a beautiful, easy-to-use interface.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="w-6 h-6 text-yellow-500" />}
              title="AI Food Analysis"
              description="Simply type what you ate, and our AI will calculate the calories and macros for you instantly."
            />
            <FeatureCard 
              icon={<Activity className="w-6 h-6 text-primary" />}
              title="Macro Tracking"
              description="Keep an eye on your protein, carbs, and fats to ensure you're fueling your body correctly."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-6 h-6 text-purple-500" />}
              title="Secure & Private"
              description="Your health data is yours. We encrypt everything and never sell your personal information."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-primary">
            <Flame className="w-5 h-5 fill-current" />
            <span className="font-display font-bold text-lg">CalorieTracker</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2025 CalorieTracker Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-background p-8 rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
