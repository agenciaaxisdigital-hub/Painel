import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateFormSubmissions, zonasEleitorais, generateCalendarHeatmap } from "@/lib/mock-data";
import { AnimatedNumber } from "@/components/dashboard/AnimatedNumber";
import { EleitorScore } from "@/components/shared/EleitorScore";
import { Search, MapPin, ChevronDown, ChevronUp, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import * as XLSX from "xlsx";

export function SecaoFormularios() {
  const submissions = useMemo(() => generateFormSubmissions(50), []);
  const calendarData = useMemo(() => generateCalendarHeatmap(90), []);
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const today = submissions.filter((s) => format(s.criadoEm, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")).length;
  const avgTime = Math.floor(submissions.reduce((s, f) => s + f.tempoPreenchimento, 0) / submissions.length);
  const filtered = submissions.filter((s) => s.nome.toLowerCase().includes(search.toLowerCase()) || s.telefone.includes(search));

  const dailyData = useMemo(() => {
    const map: Record<string, number> = {};
    submissions.forEach((s) => { const day = format(s.criadoEm, "dd/MM"); map[day] = (map[day] || 0) + 1; });
    return Object.entries(map).slice(-14).map(([day, count]) => ({ day, count }));
  }, [submissions]);

  const zoneData = useMemo(() => {
    const map: Record<string, number> = {};
    submissions.forEach((s) => { map[s.zonaEleitoral] = (map[s.zonaEleitoral] || 0) + 1; });
    return Object.entries(map).map(([zona, count]) => {
      const z = zonasEleitorais.find((ze) => ze.zona === zona);
      return { name: zona, value: count, fill: z?.cor || "hsl(240, 5%, 50%)" };
    });
  }, [submissions]);

  const handleExportXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(submissions.map((s) => ({
      Nome: s.nome, Telefone: s.telefone, Email: s.email, Mensagem: s.mensagem, Cidade: s.cidade, Bairro: s.bairro, Zona: s.zonaEleitoral,
      Lat: s.latitude.toFixed(6), Lng: s.longitude.toFixed(6), Dispositivo: s.dispositivo, Data: format(s.criadoEm, "dd/MM/yyyy HH:mm"), "Tempo(s)": s.tempoPreenchimento,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Formulários");
    XLSX.writeFile(wb, `formularios_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const handleExportCSV = () => {
    const csv = submissions.map((s) => `${s.nome},${s.telefone},${s.cidade},${s.bairro},${s.zonaEleitoral}`).join("\n");
    const blob = new Blob([`Nome,Telefone,Cidade,Bairro,Zona\n${csv}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `formularios_whatsapp_${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
  };

  // Calculate flame score for form submissions
  const getFlameScore = () => 3; // form = 3 flames minimum

  return (
    <section id="formularios" className="space-y-6 scroll-mt-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Formulários</h2>
          <p className="text-xs text-muted-foreground">Submissões de formulário — dados integrados ao site</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportXLSX} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Download className="h-3 w-3" /> XLSX
          </button>
          <button onClick={handleExportCSV} className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Download className="h-3 w-3" /> CSV WhatsApp
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Total Formulários</span><div className="text-xl font-bold"><AnimatedNumber value={submissions.length} /></div></div>
        <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Hoje</span><div className="text-xl font-bold text-primary"><AnimatedNumber value={today} /></div></div>
        <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Zona Líder</span><div className="text-xl font-bold gold-text">127ª</div></div>
        <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Bairro Líder</span><div className="text-xl font-bold text-foreground">Jardim América</div></div>
        <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Tempo Médio</span><div className="text-xl font-bold">{avgTime}s</div></div>
        <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Taxa Conversão</span><div className="text-xl font-bold text-primary">6.3%</div></div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou telefone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white/[0.03] border-white/[0.08]" />
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Nome</th>
                <th className="px-4 py-3 text-left font-medium">Telefone</th>
                <th className="px-4 py-3 text-left font-medium">Data</th>
                <th className="px-4 py-3 text-left font-medium">Cidade</th>
                <th className="px-4 py-3 text-left font-medium">Bairro</th>
                <th className="px-4 py-3 text-left font-medium">Zona</th>
                <th className="px-4 py-3 text-center font-medium">Score</th>
                <th className="px-4 py-3 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 30).map((s) => (
                <motion.tbody key={s.id} layout>
                  <tr
                    onClick={() => setExpandedRow(expandedRow === s.id ? null : s.id)}
                    className="border-b border-border/50 hover:bg-white/[0.02] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-2.5 text-foreground/80">{s.nome}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{s.telefone}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{format(s.criadoEm, "dd/MM HH:mm")}</td>
                    <td className="px-4 py-2.5 text-foreground/70">{s.cidade}</td>
                    <td className="px-4 py-2.5 text-foreground/70">{s.bairro}</td>
                    <td className="px-4 py-2.5 text-primary">{s.zonaEleitoral}</td>
                    <td className="px-4 py-2.5"><EleitorScore flames={getFlameScore()} /></td>
                    <td className="px-4 py-2.5">{expandedRow === s.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}</td>
                  </tr>
                  <AnimatePresence>
                    {expandedRow === s.id && (
                      <tr>
                        <td colSpan={8}>
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="border-t border-border/30 bg-white/[0.01] px-4 py-3">
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 text-[10px]">
                              <div><span className="text-muted-foreground">Email:</span> <span className="text-foreground/80">{s.email}</span></div>
                              <div><span className="text-muted-foreground">IP:</span> <span className="text-foreground/80">{s.enderecoIP}</span></div>
                              <div><span className="text-muted-foreground">SO:</span> <span className="text-foreground/80">{s.sistemaOperacional}</span></div>
                              <div><span className="text-muted-foreground">Navegador:</span> <span className="text-foreground/80">{s.navegador}</span></div>
                              <div><span className="text-muted-foreground">Latitude:</span> <span className="text-foreground/80">{s.latitude.toFixed(6)}</span></div>
                              <div><span className="text-muted-foreground">Longitude:</span> <span className="text-foreground/80">{s.longitude.toFixed(6)}</span></div>
                              <div><span className="text-muted-foreground">Tempo:</span> <span className="text-foreground/80">{s.tempoPreenchimento}s</span></div>
                              <div><span className="text-muted-foreground">Dispositivo:</span> <span className="text-foreground/80 capitalize">{s.dispositivo}</span></div>
                            </div>
                            <div className="mt-2 flex items-center gap-3">
                              <a href={`https://maps.google.com/?q=${s.latitude},${s.longitude}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
                                <MapPin className="h-3 w-3" /> Ver no mapa
                              </a>
                              <span className="text-[10px] text-muted-foreground">{s.mensagem}</span>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </motion.tbody>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insight Charts */}
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
          <h3 className="text-sm font-medium mb-3">Por Zona Eleitoral</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={zoneData} innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {zoneData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(240, 15%, 8%)", border: "1px solid hsl(240, 5%, 15%)", borderRadius: "8px", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <h3 className="text-sm font-medium mb-3">Calendário de Atividade</h3>
          <div className="grid grid-cols-13 gap-0.5">
            {calendarData.slice(-91).map((d, i) => (
              <div key={i} className="h-3 w-3 rounded-sm" style={{ backgroundColor: d.count === 0 ? "hsl(240, 5%, 10%)" : `hsl(341, 90%, ${Math.max(30, 70 - d.count * 3)}%)`, opacity: d.count === 0 ? 0.3 : 0.4 + d.count * 0.04 }} title={`${d.date}: ${d.count} submissões`} />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[9px] text-muted-foreground">
            <span>Menos</span>
            {[0, 3, 6, 9, 12].map((v) => <div key={v} className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: v === 0 ? "hsl(240, 5%, 10%)" : `hsl(341, 90%, ${70 - v * 3}%)` }} />)}
            <span>Mais</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
