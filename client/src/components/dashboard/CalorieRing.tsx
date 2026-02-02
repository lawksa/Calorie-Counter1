import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

interface CalorieRingProps {
  consumed: number;
  target: number;
}

export function CalorieRing({ consumed, target }: CalorieRingProps) {
  const remaining = Math.max(0, target - consumed);
  const percentage = Math.min(100, Math.round((consumed / target) * 100));
  
  const data = [
    { name: "Consumed", value: consumed },
    { name: "Remaining", value: remaining },
  ];

  // Colors: Primary Green for consumed, Muted Gray for remaining
  const COLORS = ["hsl(142 76% 36%)", "hsl(240 4.8% 90%)"];
  
  // Warning color if over budget
  if (consumed > target) {
    COLORS[0] = "hsl(0 84.2% 60.2%)"; // Red
  }

  return (
    <div className="relative w-full h-64 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={100}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            cornerRadius={10}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      <div className="absolute flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Remaining</span>
          <h2 className="text-4xl font-display font-bold text-foreground mt-1">{remaining}</h2>
          <span className="text-sm text-muted-foreground">kcal</span>
        </motion.div>
      </div>
    </div>
  );
}
