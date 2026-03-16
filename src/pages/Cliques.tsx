import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";
import { useCliques, useClickPlatforms, useHourlyHeatmap } from "@/hooks/use-supabase-data";
import { DateRangeSelector } from "@/components/shared/DateRangeSelector";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { AnimatedNumber } from "@/components/dashboard/AnimatedNumber";
import { Skeleton } from "@/components/ui/skeleton";
import { PLATFORM_COLORS, EMPTY_STATE_MESSAGE } from "@/lib/constants";
import { Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format, parseISO, subDays, getHours } from "date-fns";
import * as XLSX from "xlsx";

export default function Cliques() {
  const [days, setDays] = useState(30);
  const [search, setSearch] = useState("");
  const [heatmapPlatform, setHeatmapPlatform] = useState<string | undefined>(undefined);
  const cliques = useCliques(days);
  const platforms = useClickPlatforms(days);
  const heatmap = useHourlyHeatmap(days, heatmapPlatform);

  const data = cliques.data || [];
  const whatsappCount = useMemo(() => data.filter((c) => c.tipo_clique === "whatsapp").length, [data]);
  const instagramCount = useMemo(() => data.filter((c) => c.tipo_clique === "instagram").length, [data]);
  const facebookCount = useMemo(() => data.filter((c) => c.tipo_clique === "facebook").length, [data]);

  const peakHour = useMemo(() => {
    const hours: Record<number, number> = {};
    data.forEach((c) => { const h = getHours(parseISO(c.criado_em)); hours[h] = (hours[h] || 0) + 1; });
    const sorted = Object.entries(hours).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? `${sorted[0][0]}h` : "—";
  }, [data]);

  const leaderPlatform = useMemo(() => {
    const counts = { whatsapp: whatsappCount, instagram: instagramCount, facebook: facebookCount };
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  }, [whatsappCount, instagramCount, facebookCount]);

  // Section breakdown
  const sectionData = useMemo(() => {
    const counts: Record<string, { total: number; whatsapp: number; instagram: number; facebook: number }> = {};
    data.forEach((c) => {
      const sec = c.secao_pagina || "Desconhecida";
      if (!counts[sec]) counts[sec] = { total: 0, whatsapp: 0, instagram: 0, facebook: 0 };
      counts[sec].total++;
      const t = (c.tipo_clique || "whatsapp") as keyof typeof counts[string];
      if (t in counts[sec]) (counts[sec] as any)[t]++;
    });
    return Object.entries(counts).sort((a, b) => b[1].total - a[1].total).map(([name, vals]) => ({ name, ...vals }));
  }, [data]);

  const filtered = useMemo(() => {
    if (!search) return data;
    const s = search.toLowerCase();
    return data.filter((c) => c.cidade?.toLowerCase().includes(s) || c.tipo_clique?.toLowerCase().includes(s) || c.texto_botao?.toLowerCase().includes(s));
  }, [data, search]);

  const heatmapMax = useMemo(() => Math.max(1, ...(heatmap.data || []).map((h) => h.valor)), [heatmap.data]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data.map((c) => ({
      Tipo: c.tipo_clique, Botão: c.texto_botao || "", Seção: c.secao_pagina || "",
      Cidade: c.cidade || "", Estado: c.estado || "", Data: format(parseISO(c.criado_em), "dd/MM/yyyy HH:mm"),
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cliques");
    XLSX.writeFile(wb, `cliques_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Cliques</h1>
          <p className="text-sm text-muted-foreground">Todos os cliques em botões do Site Principal</p>
        </div>
        <DateRangeSelector selectedDays={days} onChange={setDays} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {cliques.isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : (
          <>
            <MetricCard label="Total Cliques" value={data.length} />
            <MetricCard label="WhatsApp" value={whatsappCount} color="text-success" />
            <MetricCard label="Instagram" value={instagramCount} color="text-primary" />
            <MetricCard label="Facebook" value={facebookCount} color="text-blue-400" />
            <MetricCard label="Plataforma Líder" text={leaderPlatform} />
            <MetricCard label="Horário de Pico" text={peakHour} />
          </>
        )}
      </div>

      {/* Section Breakdown */}
      {sectionData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <h3 className="text-sm font-medium mb-3">Cliques por Seção do Site</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 5%, 12%)" />
                <XAxis dataKey="name" stroke="hsl(240, 5%, 40%)" fontSize={10} />
                <YAxis stroke="hsl(240, 5%, 40%)" fontSize={10} />
                <Tooltip contentStyle={{ background: "hsl(240, 15%, 8%)", border: "1px solid hsl(240, 5%, 15%)", borderRadius: "8px", fontSize: "11px" }} />
                <Bar dataKey="whatsapp" name="WhatsApp" fill={PLATFORM_COLORS.whatsapp} stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="instagram" name="Instagram" fill={PLATFORM_COLORS.instagram} stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="facebook" name="Facebook" fill={PLATFORM_COLORS.facebook} stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Hourly Heatmap */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Mapa de Calor por Hora</h3>
          <div className="flex gap-1">
            {[{ label: "Todos", value: undefined }, { label: "WhatsApp", value: "whatsapp" }, { label: "Instagram", value: "instagram" }, { label: "Facebook", value: "facebook" }].map((opt) => (
              <button key={opt.label} onClick={() => setHeatmapPlatform(opt.value)}
                className={`rounded-lg px-3 py-1 text-[10px] font-medium transition-colors ${heatmapPlatform === opt.value ? "bg-primary text-primary-foreground" : "bg-white/[0.04] text-muted-foreground hover:text-foreground"}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {heatmap.isLoading ? <Skeleton className="h-[200px]" /> : heatmap.data ? (
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="flex gap-0.5 mb-1 pl-10">
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} className="flex-1 text-center text-[8px] text-muted-foreground">{h}</div>
                ))}
              </div>
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia, dayIdx) => (
                <div key={dia} className="flex gap-0.5 mb-0.5">
                  <div className="w-10 text-right pr-2 text-[9px] text-muted-foreground leading-[18px]">{dia}</div>
                  {Array.from({ length: 24 }, (_, h) => {
                    const cell = heatmap.data!.find((c) => c.dia === dia && c.hora === h);
                    const intensity = cell ? cell.valor / heatmapMax : 0;
                    return (
                      <div key={h} className="flex-1 h-[18px] rounded-sm transition-colors" title={`${dia} ${h}h: ${cell?.valor || 0} cliques`}
                        style={{ backgroundColor: intensity > 0 ? `hsl(45, 93%, ${85 - intensity * 60}%)` : "hsl(240, 5%, 10%)", opacity: intensity > 0 ? 0.4 + intensity * 0.6 : 0.3 }} />
                    );
                  })}
                </div>
              ))}
              <div className="flex items-center gap-2 mt-3 text-[9px] text-muted-foreground">
                <span>Menos</span>
                {[0.1, 0.3, 0.5, 0.7, 1].map((i) => (
                  <div key={i} className="h-3 w-6 rounded-sm" style={{ backgroundColor: `hsl(45, 93%, ${85 - i * 60}%)`, opacity: 0.4 + i * 0.6 }} />
                ))}
                <span>Mais</span>
              </div>
            </div>
          </div>
        ) : <EmptyState description="Sem dados de cliques para gerar o mapa de calor." />}
      </motion.div>

      {/* Clicks Table */}
      <div className="glass-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-border">
          <h3 className="text-sm font-medium">Tabela de Cliques</h3>
          <div className="flex items-center gap-2">
            <div className="relative w-52">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white/[0.03] border-white/[0.08] text-xs" />
            </div>
            <button onClick={handleExport} className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"><Download className="h-3 w-3" /> XLSX</button>
          </div>
        </div>
        {cliques.isLoading ? (
          <div className="p-5 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">{EMPTY_STATE_MESSAGE}</div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">Plataforma</th>
                  <th className="px-4 py-3 text-left font-medium">Botão</th>
                  <th className="px-4 py-3 text-left font-medium">Seção</th>
                  <th className="px-4 py-3 text-left font-medium">Cidade</th>
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                  <th className="px-4 py-3 text-left font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        c.tipo_clique === "whatsapp" ? "bg-success/10 text-success" :
                        c.tipo_clique === "instagram" ? "bg-primary/10 text-primary" :
                        "bg-blue-500/10 text-blue-400"
                      }`}>{c.tipo_clique || "whatsapp"}</span>
                    </td>
                    <td className="px-4 py-2 text-foreground/80">{c.texto_botao || "—"}</td>
                    <td className="px-4 py-2 text-foreground/80">{c.secao_pagina || "—"}</td>
                    <td className="px-4 py-2 text-foreground/80">{c.cidade || "—"}</td>
                    <td className="px-4 py-2 text-foreground/80">{c.estado || "—"}</td>
                    <td className="px-4 py-2 text-muted-foreground">{format(parseISO(c.criado_em), "dd/MM/yyyy HH:mm")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, text, color }: { label: string; value?: number; text?: string; color?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className={`text-xl font-bold mt-1 ${color || ""}`}>
        {value !== undefined ? <AnimatedNumber value={value} /> : <span className="capitalize">{text}</span>}
      </div>
    </motion.div>
  );
}
