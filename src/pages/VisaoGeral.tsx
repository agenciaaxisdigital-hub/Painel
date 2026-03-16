import { useState } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { KPICard } from "@/components/dashboard/KPICard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { DateRangeSelector } from "@/components/shared/DateRangeSelector";
import { useTableCounts, useVariation, useTimeSeries, useConnectionStatus, useTopCities, useTopPages } from "@/hooks/use-supabase-data";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, AlertTriangle, Database, MapPin, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function VisaoGeral() {
  const [days, setDays] = useState(30);
  const counts = useTableCounts(days);
  const variation = useVariation(days);
  const timeSeries = useTimeSeries(days);
  const connection = useConnectionStatus();
  const topCities = useTopCities(days);
  const topPages = useTopPages(days);

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

      {/* Top Cities + Top Pages */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <RankingCard
          title="Top Cidades"
          icon={<MapPin className="h-4 w-4 text-primary" />}
          data={topCities.data?.map((c) => ({ label: c.cidade, value: c.visitantes })) || []}
          loading={topCities.isLoading}
        />
        <RankingCard
          title="Páginas Mais Acessadas"
          icon={<FileText className="h-4 w-4 text-secondary" />}
          data={topPages.data?.map((p) => ({ label: p.pagina, value: p.visitas })) || []}
          loading={topPages.isLoading}
        />
      </div>

      {/* Activity Feed */}
      <ActivityFeed />
    </div>
  );
}

function RankingCard({ title, icon, data, loading }: { title: string; icon: React.ReactNode; data: { label: string; value: number }[]; loading: boolean }) {
  if (loading) return <Skeleton className="h-64 rounded-xl" />;
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      {data.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">Sem dados</p>
      ) : (
        <div className="space-y-2.5">
          {data.slice(0, 8).map((item, i) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground/80 truncate max-w-[70%]">{item.label}</span>
                <span className="tabular-nums text-muted-foreground font-medium">{item.value.toLocaleString("pt-BR")}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.value / max) * 100}%` }}
                  transition={{ duration: 0.8, delay: i * 0.05 }}
                  className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
