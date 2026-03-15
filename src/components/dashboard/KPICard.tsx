import { motion } from "framer-motion";
import { ArrowUp, ArrowDown, TrendingUp } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { AnimatedNumber } from "./AnimatedNumber";
import { InfoTooltip } from "./InfoTooltip";

interface KPICardProps {
  titulo: string;
  valor: number;
  variacao: number;
  sparkline: number[];
  tooltip: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  pulse?: boolean;
  delay?: number;
}

export function KPICard({ titulo, valor, variacao, sparkline, tooltip, prefix, suffix, decimals = 0, pulse, delay = 0 }: KPICardProps) {
  const isPositive = variacao >= 0;
  const sparkData = sparkline.map((v, i) => ({ v, i }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.5 }}
      className="glass-card-hover relative overflow-hidden p-5"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{titulo}</span>
          <InfoTooltip text={tooltip} />
        </div>
        {variacao !== 0 && (
          <div className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
            {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(variacao).toFixed(1)}%
          </div>
        )}
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div className={`text-3xl font-bold tracking-tight text-foreground ${pulse ? "animate-pulse-slow" : ""}`}>
          <AnimatedNumber value={valor} prefix={prefix} suffix={suffix} decimals={decimals} />
        </div>
        <div className="h-10 w-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id={`spark-${titulo}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(341, 90%, 65%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(341, 90%, 65%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke="hsl(341, 90%, 65%)" strokeWidth={1.5} fill={`url(#spark-${titulo})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
