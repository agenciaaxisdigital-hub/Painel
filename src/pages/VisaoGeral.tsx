import { useState } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { KPICard } from "@/components/dashboard/KPICard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { DateRangeSelector } from "@/components/shared/DateRangeSelector";
import { useTableCounts, useVariation, useTimeSeries, useConnectionStatus, useTopPages, useRealtimeInvalidation } from "@/hooks/use-supabase-data";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, AlertTriangle, Database, MapPin, FileText, Navigation } from "lucide-react";
import { AnimatedNumber } from "@/components/dashboard/AnimatedNumber";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";
import { ZONAS_ELEITORAIS, ZONAS_APARECIDA } from "@/lib/constants";
import { identifyZone } from "@/lib/zone-identification";
import { inferPrecision } from "@/components/shared/LocationDisplay";

function useGeographicBreakdown(days: number) {
  return useQuery({
    queryKey: ["geo-breakdown-visao-v2", days],
    queryFn: async () => {
      const since = subDays(new Date(), days).toISOString();
      const FIELDS = "zona_eleitoral, bairro, cidade, estado, latitude, longitude";
      const FILTER = "pais.eq.Brasil,pais.is.null";

      const [acessos, cliques, mensagens] = await Promise.all([
        supabase.from("acessos_site").select(FIELDS).gte("criado_em", since).or(FILTER).limit(5000),
        supabase.from("cliques_whatsapp").select(FIELDS).gte("criado_em", since).or(FILTER).limit(5000),
        supabase.from("mensagens_contato").select(FIELDS).gte("criado_em", since).or(FILTER).limit(5000),
      ]);

      const allRecords = [
        ...(acessos.data || []),
        ...(cliques.data || []),
        ...(mensagens.data || []),
      ];

      const goianiaZones: Record<string, number> = {};
      ZONAS_ELEITORAIS.forEach((z) => { goianiaZones[z.zona] = 0; });
      const aparecidaZones: Record<string, number> = {};
      ZONAS_APARECIDA.forEach((z) => { aparecidaZones[z.zona] = 0; });
      const otherCities: Record<string, number> = {};

      const goianiaZoneNames = ZONAS_ELEITORAIS.map((z) => z.zona as string);
      const aparecidaZoneNames = ZONAS_APARECIDA.map((z) => z.zona as string);

      allRecords.forEach((r) => {
        const result = identifyZone(r);
        if (result.categoria === "goiania") {
          const zona = goianiaZoneNames.includes(result.zona) ? result.zona : goianiaZoneNames[0];
          goianiaZones[zona] = (goianiaZones[zona] || 0) + 1;
        } else if (result.categoria === "aparecida") {
          const zona = aparecidaZoneNames.includes(result.zona) ? result.zona : aparecidaZoneNames[aparecidaZoneNames.length - 1];
          aparecidaZones[zona] = (aparecidaZones[zona] || 0) + 1;
        } else if (result.categoria === "interior" && result.zona) {
          otherCities[result.zona] = (otherCities[result.zona] || 0) + 1;
        }
      });

      const goiania = ZONAS_ELEITORAIS.map((z) => ({ zona: z.zona, nome: z.nome, cor: z.cor, count: goianiaZones[z.zona] || 0 }))
        .sort((a, b) => b.count - a.count);
      const aparecida = ZONAS_APARECIDA.map((z) => ({ zona: z.zona, nome: z.nome, cor: z.cor, count: aparecidaZones[z.zona] || 0 }))
        .sort((a, b) => b.count - a.count);
      const cities = Object.entries(otherCities).sort((a, b) => b[1] - a[1]).slice(0, 10)
        .map(([name, count]) => ({ name, count }));

      return { goiania, aparecida, cities };
    },
    staleTime: 60_000,
  });
}

function useLocationQuality(days: number) {
  return useQuery({
    queryKey: ["location-quality", days],
    queryFn: async () => {
      const since = subDays(new Date(), days).toISOString();
      const { data } = await supabase.from("acessos_site")
        .select("latitude, longitude, bairro")
        .gte("criado_em", since).or("pais.eq.Brasil,pais.is.null").limit(3000);

      let gps = 0;
      let ip = 0;
      (data || []).forEach((r) => {
        const precision = inferPrecision(r);
        if (precision === "GPS_PRECISO") gps++;
        else ip++;
      });
      const total = gps + ip;
      return { gps, ip, total, gpsPct: total > 0 ? ((gps / total) * 100).toFixed(1) : "0", ipPct: total > 0 ? ((ip / total) * 100).toFixed(1) : "0" };
    },
    staleTime: 60_000,
  });
}

export default function VisaoGeral() {
  const [days, setDays] = useState(30);
  const counts = useTableCounts(days);
  const variation = useVariation(days);
  const timeSeries = useTimeSeries(days);
  const connection = useConnectionStatus();
  const topPages = useTopPages(days);
  const geo = useGeographicBreakdown(days);
  const locQuality = useLocationQuality(days);
  useRealtimeInvalidation();

  const c = counts.data;
  const v = variation.data;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Visão Geral</h1>
          <p className="text-xs md:text-sm text-muted-foreground">Saúde completa do Site Principal</p>
        </div>
        <DateRangeSelector selectedDays={days} onChange={setDays} />
      </div>

      {/* Connection Status */}
      {connection.data && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={`flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 text-xs ${connection.data.status === "green" ? "bg-success/5 border border-success/20" : "bg-secondary/5 border border-secondary/20"}`}>
          {connection.data.status === "green" ? <CheckCircle className="h-4 w-4 text-success" /> : <AlertTriangle className="h-4 w-4 text-secondary" />}
          <span className="text-foreground/80">
            {connection.data.lastRecord
              ? `Último registro: ${formatDistanceToNow(new Date(connection.data.lastRecord), { addSuffix: true, locale: ptBR })}`
              : "Aguardando novos dados do Site Principal."}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : c ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <KPICard titulo="Total Visitantes" valor={c.visitantes} variacao={v?.visitantes ?? 0} sparkline={timeSeries.data?.map(d => d.visitantes) ?? []} tooltip="Pessoas que acessaram o Site Principal." delay={0} />
          <KPICard titulo="Formulários" valor={c.formularios} variacao={v?.formularios ?? 0} sparkline={timeSeries.data?.map(d => d.formularios) ?? []} tooltip="Formulários de contato enviados." delay={1} />
          <KPICard titulo="Cliques WhatsApp" valor={c.whatsapp} variacao={v?.whatsapp ?? 0} sparkline={timeSeries.data?.map(d => d.whatsapp) ?? []} tooltip="Cliques no botão de WhatsApp." delay={2} />
          <KPICard titulo="Cliques Instagram" valor={c.instagram} variacao={v?.instagram ?? 0} sparkline={timeSeries.data?.map(d => d.instagram) ?? []} tooltip="Cliques no botão de Instagram." delay={3} />
          <KPICard titulo="Cliques Facebook" valor={c.facebook} variacao={0} sparkline={timeSeries.data?.map(d => d.facebook) ?? []} tooltip="Cliques no botão de Facebook." delay={4} />
        </div>
      ) : (
        <EmptyState description="Aguardando dados do Site Principal." />
      )}

      {/* Line Chart */}
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

      {/* Geographic Breakdown + Location Quality */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <GeoRankCard
          title="Goiânia — Por Zona"
          icon={<MapPin className="h-4 w-4 text-primary" />}
          data={geo.data?.goiania.map((z) => ({ label: `${z.zona} Zona`, value: z.count, color: z.cor })) || []}
          loading={geo.isLoading}
        />
        <GeoRankCard
          title="Aparecida — Por Zona"
          icon={<MapPin className="h-4 w-4" style={{ color: "hsl(280, 70%, 60%)" }} />}
          data={geo.data?.aparecida.map((z) => ({ label: z.zona, value: z.count, color: z.cor })) || []}
          loading={geo.isLoading}
        />
        <GeoRankCard
          title="Demais Cidades do Estado"
          icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
          data={geo.data?.cities.map((c) => ({ label: c.name, value: c.count, color: "hsl(240, 5%, 64%)" })) || []}
          loading={geo.isLoading}
        />

        {/* Location Quality Widget */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Navigation className="h-4 w-4 text-success" />
            <h3 className="text-sm font-medium">Qualidade da Localização</h3>
          </div>
          {locQuality.isLoading ? <Skeleton className="h-48" /> : locQuality.data && locQuality.data.total > 0 ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-32 w-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "GPS Preciso", value: locQuality.data.gps },
                        { name: "Aprox. via IP", value: locQuality.data.ip },
                      ]}
                      dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={3} strokeWidth={0}
                    >
                      <Cell fill="hsl(142, 71%, 45%)" />
                      <Cell fill="hsl(240, 5%, 40%)" />
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(240, 15%, 8%)", border: "1px solid hsl(240, 5%, 15%)", borderRadius: "8px", fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 w-full">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm bg-success" />
                    <span className="text-foreground/80">GPS Preciso</span>
                  </div>
                  <span className="tabular-nums font-medium text-success">{locQuality.data.gpsPct}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm bg-muted-foreground/50" />
                    <span className="text-foreground/80">Aprox. via IP</span>
                  </div>
                  <span className="tabular-nums font-medium text-muted-foreground">{locQuality.data.ipPct}%</span>
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground/50 text-center leading-tight mt-1">
                GPS Preciso = visitante permitiu localização. Aprox. via IP = estimativa baseada no IP de acesso.
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">Sem dados</p>
          )}
        </motion.div>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <RankingCard title="Páginas Mais Acessadas" icon={<FileText className="h-4 w-4 text-secondary" />} data={topPages.data?.map((p) => ({ label: p.pagina, value: p.visitas })) || []} loading={topPages.isLoading} />
      </div>

      <ActivityFeed />
    </div>
  );
}

function GeoRankCard({ title, icon, data, loading }: { title: string; icon: React.ReactNode; data: { label: string; value: number; color: string }[]; loading: boolean }) {
  if (loading) return <Skeleton className="h-64 rounded-xl" />;
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">{icon}<h3 className="text-sm font-medium">{title}</h3></div>
      {data.length === 0 || data.every((d) => d.value === 0) ? (
        <p className="text-xs text-muted-foreground text-center py-8">Sem dados</p>
      ) : (
        <div className="space-y-2.5">
          {data.filter((d) => d.value > 0).slice(0, 10).map((item, i) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-foreground/80 truncate max-w-[70%]">{item.label}</span>
                </div>
                <span className="tabular-nums text-muted-foreground font-medium">{item.value.toLocaleString("pt-BR")}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(item.value / max) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.05 }}
                  className="h-full rounded-full" style={{ backgroundColor: item.color }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function RankingCard({ title, icon, data, loading }: { title: string; icon: React.ReactNode; data: { label: string; value: number }[]; loading: boolean }) {
  if (loading) return <Skeleton className="h-64 rounded-xl" />;
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">{icon}<h3 className="text-sm font-medium">{title}</h3></div>
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
                <motion.div initial={{ width: 0 }} animate={{ width: `${(item.value / max) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.05 }}
                  className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary" />
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
