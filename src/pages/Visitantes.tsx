import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useVisitantes, useDeviceBreakdown } from "@/hooks/use-supabase-data";
import { DateRangeSelector } from "@/components/shared/DateRangeSelector";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { AnimatedNumber } from "@/components/dashboard/AnimatedNumber";
import { Skeleton } from "@/components/ui/skeleton";
import { DEVICE_COLORS, EMPTY_STATE_MESSAGE } from "@/lib/constants";
import { Search, Smartphone, Monitor, Tablet, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const CHART_COLORS = ["hsl(341, 90%, 65%)", "hsl(45, 93%, 47%)", "hsl(142, 71%, 45%)", "hsl(220, 70%, 55%)", "hsl(280, 70%, 60%)"];
const deviceIcon: Record<string, any> = { mobile: Smartphone, desktop: Monitor, tablet: Tablet };

export default function Visitantes() {
  const [days, setDays] = useState(30);
  const [search, setSearch] = useState("");
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);
  const visitantes = useVisitantes(days);
  const devices = useDeviceBreakdown(days);

  const data = visitantes.data || [];
  const uniqueCookies = useMemo(() => new Set(data.map((v) => v.cookie_visitante).filter(Boolean)).size, [data]);
  const returningPct = useMemo(() => {
    const returning = data.filter((v) => (v.contador_visitas ?? 1) > 1).length;
    return data.length > 0 ? ((returning / data.length) * 100).toFixed(1) : "0";
  }, [data]);

  const filtered = useMemo(() => {
    if (!search) return data;
    const s = search.toLowerCase();
    return data.filter((v) => v.cidade?.toLowerCase().includes(s) || v.estado?.toLowerCase().includes(s) || v.pagina?.toLowerCase().includes(s));
  }, [data, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Visitantes</h1>
          <p className="text-sm text-muted-foreground">Quem acessou o Site Principal</p>
        </div>
        <DateRangeSelector selectedDays={days} onChange={setDays} />
      </div>

      {/* Behavior Intelligence Panel */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {visitantes.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : (
          <>
            <MetricCard label="Total Visitantes" value={data.length} />
            <MetricCard label="Visitantes Únicos" value={uniqueCookies} />
            <MetricCard label="Taxa de Retorno" value={returningPct} suffix="%" />
            <MetricCard label="Registros" value={data.length} />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Devices Donut */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-medium mb-3">Dispositivos</h3>
          {devices.isLoading ? <Skeleton className="h-48" /> : devices.data && devices.data.length > 0 ? (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={devices.data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} strokeWidth={0}>
                      {devices.data.map((_, i) => <Cell key={i} fill={Object.values(DEVICE_COLORS)[i] || CHART_COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(240, 15%, 8%)", border: "1px solid hsl(240, 5%, 15%)", borderRadius: "8px", fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 mt-2">
                {devices.data.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: Object.values(DEVICE_COLORS)[i] }} />
                      <span className="text-foreground/80">{d.name}</span>
                    </div>
                    <span className="tabular-nums text-muted-foreground">{d.percentage}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : <EmptyState description="Sem dados de dispositivos." />}
        </div>

        {/* Top Cities Bar */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-medium mb-3">Top 10 Cidades</h3>
          {cities.isLoading ? <Skeleton className="h-48" /> : cities.data && cities.data.length > 0 ? (
            <div className="space-y-2">
              {cities.data.map((c, i) => {
                const max = cities.data![0].visitantes;
                return (
                  <div key={c.cidade} className="flex items-center gap-3 text-xs">
                    <span className="w-36 truncate text-foreground/80">{c.cidade}</span>
                    <div className="flex-1 h-2 rounded-full bg-white/[0.06]">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(c.visitantes / max) * 100}%` }} transition={{ delay: i * 0.05 }}
                        className="h-full rounded-full bg-primary" />
                    </div>
                    <span className="tabular-nums text-muted-foreground w-8 text-right">{c.visitantes}</span>
                  </div>
                );
              })}
            </div>
          ) : <EmptyState description="Sem dados de cidades." />}
        </div>
      </div>

      {/* Top Pages */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-medium mb-3">Páginas Mais Visitadas</h3>
        {pages.isLoading ? <Skeleton className="h-48" /> : pages.data && pages.data.length > 0 ? (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pages.data} layout="vertical">
                <XAxis type="number" stroke="hsl(240, 5%, 40%)" fontSize={11} />
                <YAxis type="category" dataKey="pagina" stroke="hsl(240, 5%, 40%)" fontSize={10} width={120} />
                <Tooltip contentStyle={{ background: "hsl(240, 15%, 8%)", border: "1px solid hsl(240, 5%, 15%)", borderRadius: "8px", fontSize: "11px" }} />
                <Bar dataKey="visitas" fill="hsl(341, 90%, 65%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyState description="Sem dados de páginas." />}
      </div>

      {/* Visitors Table */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-sm font-medium">Tabela de Visitantes</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar cidade, estado..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white/[0.03] border-white/[0.08] text-xs" />
          </div>
        </div>
        {visitantes.isLoading ? (
          <div className="p-5 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">{EMPTY_STATE_MESSAGE}</div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">ID</th>
                  <th className="px-4 py-3 text-left font-medium">Cidade</th>
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                  <th className="px-4 py-3 text-left font-medium">Dispositivo</th>
                  <th className="px-4 py-3 text-left font-medium">Navegador</th>
                  <th className="px-4 py-3 text-left font-medium">Página</th>
                  <th className="px-4 py-3 text-right font-medium">Visitas</th>
                  <th className="px-4 py-3 text-left font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map((v) => {
                  const DeviceIcon = deviceIcon[v.dispositivo || ""] || Smartphone;
                  return (
                    <tr key={v.id} className="border-b border-border/50 hover:bg-white/[0.02] cursor-pointer" onClick={() => setSelectedVisitor(v)}>
                      <td className="px-4 py-2 font-mono text-foreground/60">{(v.cookie_visitante || v.id).substring(0, 8)}</td>
                      <td className="px-4 py-2 text-foreground/80">{v.cidade || "—"}</td>
                      <td className="px-4 py-2 text-foreground/80">{v.estado || "—"}</td>
                      <td className="px-4 py-2"><DeviceIcon className="h-3.5 w-3.5 text-muted-foreground" /></td>
                      <td className="px-4 py-2 text-foreground/80">{v.navegador || "—"}</td>
                      <td className="px-4 py-2 font-mono text-foreground/60">{v.pagina}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{v.contador_visitas ?? 1}</td>
                      <td className="px-4 py-2 text-muted-foreground">{format(new Date(v.criado_em), "dd/MM HH:mm")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Visitor Detail Drawer */}
      <AnimatePresence>
        {selectedVisitor && (
          <VisitorDetailDrawer visitor={selectedVisitor} onClose={() => setSelectedVisitor(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function MetricCard({ label, value, suffix }: { label: string; value: number | string; suffix?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="text-xl font-bold mt-1">
        {typeof value === "number" ? <AnimatedNumber value={value} /> : value}{suffix}
      </div>
    </motion.div>
  );
}

function VisitorDetailDrawer({ visitor, onClose }: { visitor: any; onClose: () => void }) {
  const DeviceIcon = deviceIcon[visitor.dispositivo || ""] || Smartphone;
  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed right-0 top-0 bottom-0 z-40 w-full max-w-md border-l border-white/[0.08] bg-background/95 backdrop-blur-xl overflow-y-auto"
    >
      <div className="p-5 space-y-5">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary mb-2">
              {(visitor.cookie_visitante || "??").substring(0, 2).toUpperCase()}
            </div>
            <h3 className="text-sm font-bold text-foreground">{visitor.cookie_visitante || visitor.id.substring(0, 8)}</h3>
            <p className="text-xs text-muted-foreground">{visitor.cidade || "—"}, {visitor.estado || "—"}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Visitas", value: visitor.contador_visitas ?? 1 },
            { label: "Primeira Visita", value: visitor.primeira_visita ? "Sim" : "Não" },
            { label: "País", value: visitor.pais || "—" },
            { label: "Página", value: visitor.pagina },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-white/[0.03] p-3">
              <span className="text-[10px] text-muted-foreground">{item.label}</span>
              <div className="text-sm font-bold">{item.value}</div>
            </div>
          ))}
        </div>

        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Dispositivo</h4>
          <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] p-3">
            <DeviceIcon className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs font-medium capitalize">{visitor.dispositivo || "—"}</div>
              <div className="text-[10px] text-muted-foreground">{visitor.navegador || "—"} · {visitor.sistema_operacional || "—"}</div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Tela</h4>
          <p className="text-xs text-foreground/80">{visitor.largura_tela || "—"} × {visitor.altura_tela || "—"}</p>
        </div>

        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Origem</h4>
          <div className="flex flex-wrap gap-1.5">
            {visitor.utm_source && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary">utm_source: {visitor.utm_source}</span>}
            {visitor.utm_medium && <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-[10px] font-medium text-secondary">utm_medium: {visitor.utm_medium}</span>}
            {visitor.utm_campaign && <span className="rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-medium text-success">utm_campaign: {visitor.utm_campaign}</span>}
            {visitor.referrer && <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] text-muted-foreground">ref: {visitor.referrer}</span>}
            {!visitor.utm_source && !visitor.referrer && <span className="text-xs text-muted-foreground">Acesso direto</span>}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Data de Acesso</h4>
          <p className="text-xs text-foreground/80">{format(new Date(visitor.criado_em), "dd 'de' MMMM 'de' yyyy, HH:mm:ss", { locale: ptBR })}</p>
        </div>
      </div>
    </motion.div>
  );
}
