import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/dashboard/AnimatedNumber";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { DateRangeSelector } from "@/components/shared/DateRangeSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormularios } from "@/hooks/use-supabase-data";
import { ZONE_COLOR_MAP, EMPTY_STATE_MESSAGE } from "@/lib/constants";
import { Download, Search, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format, parseISO, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import * as XLSX from "xlsx";

export default function Formularios() {
  const [days, setDays] = useState(30);
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const formularios = useFormularios(days);

  const data = formularios.data || [];

  const today = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    return data.filter((s) => format(parseISO(s.criado_em), "yyyy-MM-dd") === todayStr).length;
  }, [data]);

  const filtered = useMemo(() => {
    if (!search) return data;
    const s = search.toLowerCase();
    return data.filter((f) => f.nome.toLowerCase().includes(s) || f.telefone.includes(s) || f.cidade?.toLowerCase().includes(s));
  }, [data, search]);

  // Per-day chart
  const dailyData = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach((s) => {
      const day = format(parseISO(s.criado_em), "dd/MM");
      map[day] = (map[day] || 0) + 1;
    });
    return Object.entries(map).slice(-14).map(([day, count]) => ({ day, count }));
  }, [data]);

  // Per-city donut
  const cityData = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach((s) => {
      const c = s.cidade || "Desconhecida";
      map[c] = (map[c] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [data]);

  const DONUT_COLORS = ["hsl(341, 90%, 65%)", "hsl(45, 93%, 47%)", "hsl(142, 71%, 45%)", "hsl(220, 70%, 55%)", "hsl(280, 70%, 60%)", "hsl(30, 80%, 55%)", "hsl(180, 60%, 50%)", "hsl(0, 70%, 60%)"];

  // Calendar heatmap from real data
  const calendarData = useMemo(() => {
    const result: { date: string; count: number }[] = [];
    const counts: Record<string, number> = {};
    data.forEach((s) => {
      const d = format(parseISO(s.criado_em), "yyyy-MM-dd");
      counts[d] = (counts[d] || 0) + 1;
    });
    for (let i = 90; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd");
      result.push({ date, count: counts[date] || 0 });
    }
    return result;
  }, [data]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data.map((s) => ({
      Nome: s.nome, Telefone: s.telefone, Email: s.email || "", Mensagem: s.mensagem,
      Cidade: s.cidade || "", Estado: s.estado || "", País: s.pais || "",
      Latitude: s.latitude, Longitude: s.longitude, IP: s.endereco_ip || "",
      Data: format(parseISO(s.criado_em), "dd/MM/yyyy HH:mm"), Lida: s.lida ? "Sim" : "Não",
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Formulários");
    XLSX.writeFile(wb, `formularios_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Formulários</h1>
          <p className="text-sm text-muted-foreground">Submissões de formulário de contato do Site Principal</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeSelector selectedDays={days} onChange={setDays} />
          <button onClick={handleExport} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors rose-glow">
            <Download className="h-4 w-4" /> Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {formularios.isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Total Formulários</span><div className="text-2xl font-bold"><AnimatedNumber value={data.length} /></div></div>
          <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Hoje</span><div className="text-2xl font-bold text-primary"><AnimatedNumber value={today} /></div></div>
          <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Não Lidas</span><div className="text-2xl font-bold text-destructive"><AnimatedNumber value={data.filter((f) => !f.lida).length} /></div></div>
          <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Com Coordenadas</span><div className="text-2xl font-bold"><AnimatedNumber value={data.filter((f) => f.latitude && f.longitude).length} /></div></div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome, telefone ou cidade..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white/[0.03] border-white/[0.08]" />
      </div>

      {/* Table */}
      {formularios.isLoading ? (
        <div className="glass-card p-5 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState description={EMPTY_STATE_MESSAGE} />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">Nome</th>
                  <th className="px-4 py-3 text-left font-medium">Telefone</th>
                  <th className="px-4 py-3 text-left font-medium">Cidade</th>
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                  <th className="px-4 py-3 text-left font-medium">Data</th>
                  <th className="px-4 py-3 text-center font-medium">Lida</th>
                  <th className="px-4 py-3 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map((s) => (
                  <motion.tr key={s.id} layout className="border-b border-border/50">
                    <td colSpan={7} className="p-0">
                      <button onClick={() => setExpandedRow(expandedRow === s.id ? null : s.id)} className="flex w-full items-center hover:bg-white/[0.02] transition-colors text-left">
                        <span className="px-4 py-2.5 text-foreground/80 flex-1 min-w-[120px]">{s.nome}</span>
                        <span className="px-4 py-2.5 text-muted-foreground min-w-[120px]">{s.telefone}</span>
                        <span className="px-4 py-2.5 text-foreground/70 min-w-[100px]">{s.cidade || "—"}</span>
                        <span className="px-4 py-2.5 text-foreground/70 min-w-[60px]">{s.estado || "—"}</span>
                        <span className="px-4 py-2.5 text-muted-foreground min-w-[100px]">{format(parseISO(s.criado_em), "dd/MM HH:mm")}</span>
                        <span className="px-4 py-2.5 text-center min-w-[50px]">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] ${s.lida ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                            {s.lida ? "Sim" : "Não"}
                          </span>
                        </span>
                        <span className="px-4 py-2.5 w-8">{expandedRow === s.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}</span>
                      </button>
                      {expandedRow === s.id && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="border-t border-border/30 bg-white/[0.01] px-4 py-3">
                          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 text-[10px]">
                            <div><span className="text-muted-foreground">Email:</span> <span className="text-foreground/80">{s.email || "—"}</span></div>
                            <div><span className="text-muted-foreground">IP:</span> <span className="text-foreground/80">{s.endereco_ip || "—"}</span></div>
                            <div><span className="text-muted-foreground">País:</span> <span className="text-foreground/80">{s.pais || "—"}</span></div>
                            <div><span className="text-muted-foreground">User Agent:</span> <span className="text-foreground/80 truncate block max-w-[200px]">{s.user_agent || "—"}</span></div>
                            {s.latitude && s.longitude && (
                              <>
                                <div><span className="text-muted-foreground">Latitude:</span> <span className="text-foreground/80">{s.latitude}</span></div>
                                <div><span className="text-muted-foreground">Longitude:</span> <span className="text-foreground/80">{s.longitude}</span></div>
                              </>
                            )}
                          </div>
                          <div className="mt-2 rounded-lg bg-white/[0.02] p-2">
                            <span className="text-[10px] text-muted-foreground">Mensagem:</span>
                            <p className="text-xs text-foreground/80 mt-1">{s.mensagem}</p>
                          </div>
                          {s.latitude && s.longitude && (
                            <a href={`https://maps.google.com/?q=${s.latitude},${s.longitude}`} target="_blank" rel="noopener" className="mt-2 inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
                              <MapPin className="h-3 w-3" /> Ver no mapa
                            </a>
                          )}
                        </motion.div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Insights Charts */}
      {data.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
            <h3 className="text-sm font-medium mb-3">Submissões por Dia</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 5%, 12%)" />
                  <XAxis dataKey="day" stroke="hsl(240, 5%, 40%)" fontSize={10} />
                  <YAxis stroke="hsl(240, 5%, 40%)" fontSize={10} />
                  <Bar dataKey="count" fill="hsl(341, 90%, 65%)" radius={[4, 4, 0, 0]} />
                  <Tooltip contentStyle={{ background: "hsl(240, 15%, 8%)", border: "1px solid hsl(240, 5%, 15%)", borderRadius: "8px", fontSize: "12px" }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
            <h3 className="text-sm font-medium mb-3">Por Cidade</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={cityData} innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value" strokeWidth={0}>
                    {cityData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(240, 15%, 8%)", border: "1px solid hsl(240, 5%, 15%)", borderRadius: "8px", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 mt-2">
              {cityData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    <span className="text-foreground/80">{d.name}</span>
                  </div>
                  <span className="tabular-nums text-muted-foreground">{d.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
            <h3 className="text-sm font-medium mb-3">Calendário de Atividade</h3>
            <div className="grid grid-cols-13 gap-0.5">
              {calendarData.map((d, i) => (
                <div key={i} className="h-3 w-3 rounded-sm transition-colors" style={{
                  backgroundColor: d.count === 0 ? "hsl(240, 5%, 10%)" : `hsl(341, 90%, ${Math.max(30, 70 - d.count * 8)}%)`,
                  opacity: d.count === 0 ? 0.3 : 0.4 + Math.min(d.count * 0.1, 0.6),
                }} title={`${d.date}: ${d.count} submissões`} />
              ))}
            </div>
            <div className="mt-2 flex items-center gap-1 text-[9px] text-muted-foreground">
              <span>Menos</span>
              {[0, 3, 6, 9, 12].map((v) => (
                <div key={v} className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: v === 0 ? "hsl(240, 5%, 10%)" : `hsl(341, 90%, ${70 - v * 3}%)` }} />
              ))}
              <span>Mais</span>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}