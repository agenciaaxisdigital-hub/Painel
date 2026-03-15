import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateVisitors, deviceData, trafficData, topCities } from "@/lib/mock-data";
import { AnimatedNumber } from "@/components/dashboard/AnimatedNumber";
import { InfoTooltip } from "@/components/dashboard/InfoTooltip";
import { EleitorScore } from "@/components/shared/EleitorScore";
import { VisitorDrawer } from "@/components/shared/VisitorDrawer";
import { Search, Smartphone, Monitor, Tablet, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import * as XLSX from "xlsx";

const deviceIcon = { mobile: Smartphone, desktop: Monitor, tablet: Tablet };

export function SecaoVisitantes() {
  const visitors = useMemo(() => generateVisitors(100), []);
  const [search, setSearch] = useState("");
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);
  const [sortKey, setSortKey] = useState<string>("totalVisitas");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = visitors
    .filter((v) => !search || v.cookieId.includes(search) || v.cidade.toLowerCase().includes(search.toLowerCase()))
    .sort((a: any, b: any) => sortDir === "desc" ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]);

  const avgVisits = (visitors.reduce((s, v) => s + v.totalVisitas, 0) / visitors.length).toFixed(1);
  const returnRate = ((visitors.filter((v) => v.totalVisitas > 1).length / visitors.length) * 100).toFixed(1);
  const maxCityVisitors = topCities[0]?.visitantes || 1;

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const exportVisitors = () => {
    const ws = XLSX.utils.json_to_sheet(visitors.map((v) => ({
      ID: v.cookieId, Cidade: v.cidade, Zona: v.zonaEleitoral || "", Dispositivo: v.dispositivo,
      Visitas: v.totalVisitas, "Tempo(s)": v.tempoTotal, Score: v.flames,
      "Primeira Visita": format(v.primeiraVisita, "dd/MM/yyyy"),
      "Última Visita": format(v.ultimaVisita, "dd/MM/yyyy"),
      Ações: v.acoes.join(", "),
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Visitantes");
    XLSX.writeFile(wb, `visitantes_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  return (
    <section id="visitantes" className="space-y-6 scroll-mt-16">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Visitantes</h2>
          <p className="text-xs text-muted-foreground">Perfis individuais de visitantes — CRM do eleitorado</p>
        </div>
        <button onClick={exportVisitors} className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <Download className="h-3 w-3" /> Exportar
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Total Visitantes</span><div className="text-xl font-bold"><AnimatedNumber value={visitors.length} /></div></div>
        <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Visitantes Únicos</span><div className="text-xl font-bold"><AnimatedNumber value={Math.floor(visitors.length * 0.82)} /></div></div>
        <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Taxa de Retorno</span><div className="text-xl font-bold text-primary">{returnRate}%</div></div>
        <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Média Visitas/Pessoa</span><div className="text-xl font-bold gold-text">{avgVisits}</div></div>
        <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Tempo Médio</span><div className="text-xl font-bold">3m 12s</div></div>
      </div>

      {/* Three Columns: Devices, Traffic, Cities */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-medium">Dispositivos</h3>
            <InfoTooltip text="Distribuição de dispositivos dos visitantes." />
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deviceData} innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                  {deviceData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(240, 15%, 8%)", border: "1px solid hsl(240, 5%, 15%)", borderRadius: "8px", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-medium">Origem do Tráfego</h3>
            <InfoTooltip text="De onde os visitantes vêm antes de acessar o site." />
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={trafficData} innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                  {trafficData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(240, 15%, 8%)", border: "1px solid hsl(240, 5%, 15%)", borderRadius: "8px", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-medium">Top 10 Cidades</h3>
            <InfoTooltip text="Cidades com mais visitantes no site." />
          </div>
          <div className="space-y-2">
            {topCities.map((c, i) => (
              <div key={c.cidade} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-4">{i + 1}</span>
                <span className="text-xs text-foreground/80 flex-1 truncate">{c.cidade}</span>
                <div className="w-24 h-1.5 rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(c.visitantes / maxCityVisitors) * 100}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground tabular-nums w-10 text-right">{c.visitantes}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por ID ou cidade..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white/[0.03] border-white/[0.08]" />
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Visitante</th>
                <th className="px-4 py-3 text-left font-medium">Cidade</th>
                <th className="px-4 py-3 text-left font-medium">Zona</th>
                <th className="px-4 py-3 text-center font-medium">Disp.</th>
                <th className="px-4 py-3 text-center font-medium">Score</th>
                <th className="px-4 py-3 text-right font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort("totalVisitas")}>Visitas</th>
                <th className="px-4 py-3 text-left font-medium">Última</th>
                <th className="px-4 py-3 text-left font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 30).map((v) => {
                const DeviceIcon = deviceIcon[v.dispositivo as keyof typeof deviceIcon];
                return (
                  <tr key={v.id} onClick={() => setSelectedVisitor(v)} className="border-b border-border/50 hover:bg-white/[0.03] cursor-pointer transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">{v.cookieId.substring(3, 5).toUpperCase()}</div>
                        <span className="text-foreground/70">{v.cookieId}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-foreground/80">{v.cidade}</td>
                    <td className="px-4 py-2.5 text-primary">{v.zonaEleitoral || "—"}</td>
                    <td className="px-4 py-2.5 text-center"><DeviceIcon className="h-3.5 w-3.5 mx-auto text-muted-foreground" /></td>
                    <td className="px-4 py-2.5"><EleitorScore flames={v.flames} /></td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{v.totalVisitas}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{format(v.ultimaVisita, "dd/MM", { locale: ptBR })}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1">
                        {v.acoes.map((a) => (
                          <span key={a} className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${a === "Formulário" ? "bg-success/10 text-success" : a === "WhatsApp" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}>{a}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visitor Drawer */}
      <AnimatePresence>
        {selectedVisitor && <VisitorDrawer visitor={selectedVisitor} onClose={() => setSelectedVisitor(null)} />}
      </AnimatePresence>
    </section>
  );
}
