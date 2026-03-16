import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { KPICard } from "@/components/dashboard/KPICard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { DateRangeSelector } from "@/components/shared/DateRangeSelector";
import { useTableCounts, useVariation, useTimeSeries, useDeviceBreakdown, useTrafficOrigin, useClickPlatforms, useConnectionStatus } from "@/hooks/use-supabase-data";
import { DEVICE_COLORS, PLATFORM_COLORS } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, AlertTriangle, Database } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const CHART_COLORS = ["hsl(341, 90%, 65%)", "hsl(45, 93%, 47%)", "hsl(142, 71%, 45%)", "hsl(280, 70%, 60%)", "hsl(220, 70%, 55%)"];

export default function VisaoGeral() {
  const [days, setDays] = useState(30);
  const counts = useTableCounts(days);
  const variation = useVariation(days);
  const timeSeries = useTimeSeries(days);
  const devices = useDeviceBreakdown(days);
  const traffic = useTrafficOrigin(days);
  const platforms = useClickPlatforms(days);
  const connection = useConnectionStatus();

  const c = counts.data;
  const v = variation.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Visão Geral</h1>
          <p className="text-sm text-muted-foreground">Saúde completa do Site Principal</p>
        </div>
        <DateRangeSelector selectedDays={days} onChange={setDays} />
      </div>

      {/* Connection Status Banner */}
      {connection.data && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={`flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 text-xs ${
            connection.data.status === "green" ? "bg-success/5 border border-success/20" : "bg-secondary/5 border border-secondary/20"
          }`}
        >
          {connection.data.status === "green" ? (
            <CheckCircle className="h-4 w-4 text-success" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-secondary" />
          )}
          <span className="text-foreground/80">
            {connection.data.lastRecord
              ? `Último registro: ${formatDistanceToNow(new Date(connection.data.lastRecord), { addSuffix: true, locale: ptBR })}`
              : "Aguardando novos dados do Site Principal."
            }
          </span>
          <div className="flex gap-2 ml-auto">
            {Object.entries(connection.data.counts).map(([key, val]) => (
              <span key={key} className="rounded-full bg-white/[0.06] px-2 py-0.5 tabular-nums">
                <Database className="h-3 w-3 inline mr-1 text-muted-foreground" />{key}: {val}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* KPI Cards */}
      {counts.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : c ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KPICard titulo="Total Visitantes" valor={c.visitantes} variacao={v?.visitantes ?? 0} sparkline={[]} tooltip="Pessoas que acessaram o Site Principal." delay={0} />
          <KPICard titulo="Formulários" valor={c.formularios} variacao={v?.formularios ?? 0} sparkline={[]} tooltip="Formulários de contato enviados." delay={1} />
          <KPICard titulo="Cliques WhatsApp" valor={c.whatsapp} variacao={v?.whatsapp ?? 0} sparkline={[]} tooltip="Cliques no botão de WhatsApp." delay={2} />
          <KPICard titulo="Cliques Instagram" valor={c.instagram} variacao={v?.instagram ?? 0} sparkline={[]} tooltip="Cliques no botão de Instagram." delay={3} />
          <KPICard titulo="Cliques Facebook" valor={c.facebook} variacao={0} sparkline={[]} tooltip="Cliques no botão de Facebook." delay={4} />
          <KPICard titulo="Taxa Conversão" valor={c.taxaConversao} variacao={0} sparkline={[]} tooltip="Formulários ÷ Visitantes em percentual." suffix="%" decimals={2} delay={5} />
        </div>
      ) : (
        <EmptyState description="Aguardando dados do Site Principal." />
      )}

      {/* Multi-series Line Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
        <h3 className="mb-4 text-sm font-medium text-foreground">Evolução Diária</h3>
        {timeSeries.isLoading ? (
          <Skeleton className="h-[300px] rounded-lg" />
        ) : timeSeries.data && timeSeries.data.some((d) => d.visitantes > 0) ? (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeries.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 5%, 12%)" />
                <XAxis dataKey="date" stroke="hsl(240, 5%, 40%)" fontSize={11} tickLine={false} />
                <YAxis stroke="hsl(240, 5%, 40%)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "hsl(240, 15%, 8%)", border: "1px solid hsl(240, 5%, 15%)", borderRadius: "8px", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Line type="monotone" dataKey="visitantes" name="Visitantes" stroke="hsl(341, 90%, 65%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="formularios" name="Formulários" stroke="hsl(45, 93%, 47%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="whatsapp" name="WhatsApp" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="instagram" name="Instagram" stroke="hsl(280, 70%, 60%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="facebook" name="Facebook" stroke="hsl(220, 70%, 55%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState description="Dados aparecerão aqui conforme visitantes acessam o site." />
        )}
      </motion.div>

      {/* Three Donut Charts */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <DonutCard title="Dispositivos" data={devices.data} loading={devices.isLoading} colors={Object.values(DEVICE_COLORS)} />
        <DonutCard title="Origem do Tráfego" data={traffic.data} loading={traffic.isLoading} colors={CHART_COLORS} />
        <DonutCard title="Plataformas de Clique" data={platforms.data} loading={platforms.isLoading} colors={[PLATFORM_COLORS.whatsapp, PLATFORM_COLORS.instagram, PLATFORM_COLORS.facebook]} />
      </div>

      {/* Activity Feed */}
      <ActivityFeed />
    </div>
  );
}

function DonutCard({ title, data, loading, colors }: { title: string; data: any[] | undefined; loading: boolean; colors: string[] }) {
  if (loading) return <Skeleton className="h-64 rounded-xl" />;
  if (!data || data.length === 0) {
    return (
      <div className="glass-card p-5">
        <h3 className="text-sm font-medium mb-3">{title}</h3>
        <p className="text-xs text-muted-foreground text-center py-8">Sem dados</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
      <h3 className="text-sm font-medium mb-3">{title}</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} strokeWidth={0}>
              {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "hsl(240, 15%, 8%)", border: "1px solid hsl(240, 5%, 15%)", borderRadius: "8px", fontSize: "11px" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-1 mt-2">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colors[i % colors.length] }} />
              <span className="text-foreground/80">{d.name}</span>
            </div>
            <span className="tabular-nums text-muted-foreground">{d.percentage}%</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
