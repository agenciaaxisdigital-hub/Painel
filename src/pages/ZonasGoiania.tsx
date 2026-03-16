import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ZONAS_ELEITORAIS, ZONAS_APARECIDA, TOTAL_ELEITORES_GOIANIA, TOTAL_ELEITORES_APARECIDA } from "@/lib/constants";
import { identifyZone } from "@/lib/zone-identification";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Download, MapPin, Trophy, BarChart3 } from "lucide-react";
import { format, subDays } from "date-fns";
import * as XLSX from "xlsx";

interface RegionData {
  nome: string;
  cor: string;
  visitors: number;
  forms: number;
  whatsapp: number;
  instagram: number;
  facebook: number;
  clicks: number;
  total: number;
}

interface ZoneData extends RegionData {
  zona: string;
  eleitores: number;
  penetracao: number;
  conversao: number;
}

type TabKey = "goiania" | "aparecida" | "estado" | "comparativo";

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "goiania", label: "Goiânia", icon: MapPin },
  { key: "aparecida", label: "Aparecida", icon: MapPin },
  { key: "estado", label: "Estado", icon: MapPin },
  { key: "comparativo", label: "Comparativo", icon: BarChart3 },
];

// Classificação geográfica centralizada em src/lib/zone-identification.ts

// ══════════════════════════════════════════════
// MAIN DATA HOOK — cidade-first classification
// ══════════════════════════════════════════════
function useRegionDistribution(days: number) {
  return useQuery({
    queryKey: ["region-distribution-v4", days],
    queryFn: async () => {
      const since = subDays(new Date(), days).toISOString();
      const BRASIL_FILTER = "pais.eq.Brasil,pais.is.null";
      const SELECT_FIELDS = "zona_eleitoral, bairro, cidade, estado, latitude, longitude";

      const [acessos, cliques, mensagens] = await Promise.all([
        supabase.from("acessos_site").select(SELECT_FIELDS).gte("criado_em", since).or(BRASIL_FILTER).limit(5000),
        supabase.from("cliques_whatsapp").select(`${SELECT_FIELDS}, tipo_clique`).gte("criado_em", since).or(BRASIL_FILTER).limit(5000),
        supabase.from("mensagens_contato").select(SELECT_FIELDS).gte("criado_em", since).or(BRASIL_FILTER).limit(5000),
      ]);

      // Region summaries
      const regions: Record<string, RegionData> = {
        goiania: { nome: "Goiânia", cor: "#E8825C", visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0, clicks: 0, total: 0 },
        aparecida: { nome: "Aparecida de Goiânia", cor: "#FF6B8A", visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0, clicks: 0, total: 0 },
        restante: { nome: "Restante de Goiás", cor: "#4DB8D4", visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0, clicks: 0, total: 0 },
        nao_identificado: { nome: "Não Identificado", cor: "#6B7280", visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0, clicks: 0, total: 0 },
      };

      // Zone counters — Goiânia
      const goianiaZoneCounts: Record<string, { visitors: number; forms: number; whatsapp: number; instagram: number; facebook: number }> = {};
      ZONAS_ELEITORAIS.forEach((z) => { goianiaZoneCounts[z.zona] = { visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0 }; });
      goianiaZoneCounts["Não identificada"] = { visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0 };

      // Zone counters — Aparecida (same pattern)
      const aparecidaZoneCounts: Record<string, { visitors: number; forms: number; whatsapp: number; instagram: number; facebook: number }> = {};
      ZONAS_APARECIDA.forEach((z) => { aparecidaZoneCounts[z.zona] = { visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0 }; });
      aparecidaZoneCounts["Não identificada"] = { visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0 };

      // City counters for Estado (no hardcoded list — dynamic)
      const cityCounts: Record<string, RegionData & { estado?: string }> = {};

      function addToRegion(region: string, field: "visitors" | "forms" | "whatsapp" | "instagram" | "facebook") {
        regions[region][field]++;
        if (field === "whatsapp" || field === "instagram" || field === "facebook") regions[region].clicks++;
        regions[region].total++;
      }

      function addToZone(zoneCounts: Record<string, any>, zona: string, field: string) {
        if (!zoneCounts[zona]) zoneCounts[zona] = { visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0 };
        zoneCounts[zona][field]++;
      }

      function addToCity(cityName: string, estado: string | null | undefined, field: "visitors" | "forms" | "whatsapp" | "instagram" | "facebook") {
        if (!cityCounts[cityName]) {
          cityCounts[cityName] = { nome: cityName, cor: "#4DB8D4", visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0, clicks: 0, total: 0, estado: estado || undefined };
        }
        cityCounts[cityName][field]++;
        if (field === "whatsapp" || field === "instagram" || field === "facebook") cityCounts[cityName].clicks++;
        cityCounts[cityName].total++;
      }

      function processRecord(r: any, field: "visitors" | "forms" | "whatsapp" | "instagram" | "facebook") {
        const cat = classifyCidade(r.cidade);

        if (cat === "goiania") {
          addToRegion("goiania", field);
          const zona = identifyGoianiaZoneFromBairro(r.bairro, r.zona_eleitoral);
          addToZone(goianiaZoneCounts, zona, field);
        } else if (cat === "aparecida") {
          addToRegion("aparecida", field);
          const zona = identifyAparecidaZone(r.bairro, r.zona_eleitoral);
          addToZone(aparecidaZoneCounts, zona, field);
        } else if (cat === "interior") {
          addToRegion("restante", field);
          addToCity(r.cidade!, r.estado, field);
        } else {
          addToRegion("nao_identificado", field);
        }
      }

      // Process all records
      (acessos.data || []).forEach((r) => processRecord(r, "visitors"));
      (cliques.data || []).forEach((r) => {
        const tipo = (r as any).tipo_clique || "whatsapp";
        const field = tipo === "instagram" ? "instagram" : tipo === "facebook" ? "facebook" : "whatsapp";
        processRecord(r, field as any);
      });
      (mensagens.data || []).forEach((r) => processRecord(r, "forms"));

      // Build zone arrays — Goiânia
      const goianiaZones: ZoneData[] = ZONAS_ELEITORAIS.map((z) => {
        const c = goianiaZoneCounts[z.zona] || { visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0 };
        const clicks = c.whatsapp + c.instagram + c.facebook;
        const total = c.visitors + c.forms + clicks;
        return {
          ...z, visitors: c.visitors, forms: c.forms, whatsapp: c.whatsapp, instagram: c.instagram, facebook: c.facebook,
          clicks, total,
          penetracao: z.eleitores > 0 ? parseFloat(((c.visitors / z.eleitores) * 100).toFixed(3)) : 0,
          conversao: c.visitors > 0 ? parseFloat(((c.forms / c.visitors) * 100).toFixed(1)) : 0,
        };
      });

      const goianiaNI = goianiaZoneCounts["Não identificada"];
      if (goianiaNI && (goianiaNI.visitors + goianiaNI.forms + goianiaNI.whatsapp + goianiaNI.instagram + goianiaNI.facebook) > 0) {
        const clicks = goianiaNI.whatsapp + goianiaNI.instagram + goianiaNI.facebook;
        goianiaZones.push({
          zona: "Não identificada", nome: "Zona não identificada", cor: "#E8825C", eleitores: 0,
          visitors: goianiaNI.visitors, forms: goianiaNI.forms, whatsapp: goianiaNI.whatsapp, instagram: goianiaNI.instagram, facebook: goianiaNI.facebook,
          clicks, total: goianiaNI.visitors + goianiaNI.forms + clicks, penetracao: 0,
          conversao: goianiaNI.visitors > 0 ? parseFloat(((goianiaNI.forms / goianiaNI.visitors) * 100).toFixed(1)) : 0,
        });
      }

      // Build zone arrays — Aparecida (identical pattern)
      const aparecidaZones: ZoneData[] = ZONAS_APARECIDA.map((z) => {
        const c = aparecidaZoneCounts[z.zona] || { visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0 };
        const clicks = c.whatsapp + c.instagram + c.facebook;
        const total = c.visitors + c.forms + clicks;
        return {
          ...z, visitors: c.visitors, forms: c.forms, whatsapp: c.whatsapp, instagram: c.instagram, facebook: c.facebook,
          clicks, total,
          penetracao: z.eleitores > 0 ? parseFloat(((c.visitors / z.eleitores) * 100).toFixed(3)) : 0,
          conversao: c.visitors > 0 ? parseFloat(((c.forms / c.visitors) * 100).toFixed(1)) : 0,
        };
      });

      const aparecidaNI = aparecidaZoneCounts["Não identificada"];
      if (aparecidaNI && (aparecidaNI.visitors + aparecidaNI.forms + aparecidaNI.whatsapp + aparecidaNI.instagram + aparecidaNI.facebook) > 0) {
        const clicks = aparecidaNI.whatsapp + aparecidaNI.instagram + aparecidaNI.facebook;
        aparecidaZones.push({
          zona: "Não identificada", nome: "Zona não identificada — Aparecida", cor: "#9333EA", eleitores: 0,
          visitors: aparecidaNI.visitors, forms: aparecidaNI.forms, whatsapp: aparecidaNI.whatsapp, instagram: aparecidaNI.instagram, facebook: aparecidaNI.facebook,
          clicks, total: aparecidaNI.visitors + aparecidaNI.forms + clicks, penetracao: 0,
          conversao: aparecidaNI.visitors > 0 ? parseFloat(((aparecidaNI.forms / aparecidaNI.visitors) * 100).toFixed(1)) : 0,
        });
      }

      const cities = Object.values(cityCounts).sort((a, b) => b.total - a.total);
      const totalGeral = Object.values(regions).reduce((s, r) => s + r.total, 0);

      return { regions, goianiaZones, aparecidaZones, cities, totalGeral };
    },
    staleTime: 60_000,
  });
}

/* ─── Metric Grid (shared by all tabs) ─── */
function MetricGrid({ data, size = "sm" }: { data: RegionData; size?: "sm" | "lg" }) {
  const isLg = size === "lg";
  return (
    <div className={`grid grid-cols-3 gap-3 ${isLg ? "md:grid-cols-6" : "md:grid-cols-3"}`}>
      {[
        { label: "Visitantes", value: data.visitors, color: "" },
        { label: "Formulários", value: data.forms, color: "" },
        { label: "WhatsApp", value: data.whatsapp, color: "text-success" },
        { label: "Instagram", value: data.instagram, color: "text-primary" },
        { label: "Facebook", value: data.facebook, color: "text-blue-400" },
        { label: "Total", value: data.total, color: "font-bold" },
      ].map((m) => (
        <div key={m.label} className="space-y-0.5">
          <span className="text-[10px] text-muted-foreground">{m.label}</span>
          <div className={`${isLg ? "text-xl" : "text-lg"} font-bold tabular-nums ${m.color}`}>
            {m.value.toLocaleString("pt-BR")}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Zone Row (shared by Goiânia AND Aparecida — same component) ─── */
function ZoneRow({ z, i, maxVisitors, isSelected, onSelect }: {
  z: ZoneData; i: number; maxVisitors: number; isSelected: boolean; onSelect: () => void;
}) {
  const barPct = maxVisitors > 0 ? (z.visitors / maxVisitors) * 100 : 0;
  const displayZona = z.zona.includes("Zona") || z.zona === "Não identificada" ? z.zona : `${z.zona} Zona`;

  return (
    <div>
      <button onClick={onSelect}
        className={`w-full rounded-lg p-3 text-left transition-all hover:bg-white/[0.03] ${isSelected ? "bg-white/[0.04] ring-1 ring-primary/30" : ""}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: z.cor }} />
            <span className="text-xs font-medium">{displayZona}</span>
            {z.nome && z.zona !== "Não identificada" && <span className="text-[10px] text-muted-foreground">— {z.nome}</span>}
          </div>
          <div className="flex items-center gap-3 text-[10px] tabular-nums">
            <span>{z.visitors} visit.</span>
            <span className="text-success">{z.whatsapp} WA</span>
            <span className="text-primary">{z.instagram} IG</span>
            <span className="text-blue-400">{z.facebook} FB</span>
            <span>{z.forms} forms</span>
            {z.penetracao > 0 && <span className="text-primary font-medium">{z.penetracao}%</span>}
          </div>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/[0.04] overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${barPct}%` }}
            transition={{ duration: 0.5, delay: i * 0.03 }}
            className="h-full rounded-full" style={{ backgroundColor: z.cor }} />
        </div>
      </button>
      <AnimatePresence>
        {isSelected && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="ml-5 mt-1 mb-2 rounded-lg bg-white/[0.02] border border-white/[0.06] p-4">
              <div className="grid grid-cols-3 gap-3 md:grid-cols-6 text-xs mb-3">
                {z.eleitores > 0 && <div><span className="text-muted-foreground">Eleitores</span><div className="font-bold gold-text">{z.eleitores.toLocaleString("pt-BR")}</div></div>}
                <div><span className="text-muted-foreground">Visitantes</span><div className="font-bold">{z.visitors}</div></div>
                <div><span className="text-muted-foreground">Formulários</span><div className="font-bold">{z.forms}</div></div>
                <div><span className="text-muted-foreground">WhatsApp</span><div className="font-bold text-success">{z.whatsapp}</div></div>
                <div><span className="text-muted-foreground">Instagram</span><div className="font-bold text-primary">{z.instagram}</div></div>
                <div><span className="text-muted-foreground">Conversão</span><div className="font-bold">{z.conversao}%</div></div>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-2.5 text-[11px] text-foreground/80">
                <Target className="h-3 w-3 text-primary inline mr-1" />
                <strong>{displayZona}</strong>{z.nome ? ` (${z.nome})` : ""}
                {z.eleitores > 0 && <> — {z.eleitores.toLocaleString("pt-BR")} eleitores, acesso de {z.penetracao}%</>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Page ─── */
export default function ZonasGoiania() {
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState<TabKey>("goiania");
  const [selectedZona, setSelectedZona] = useState<string | null>(null);
  const { data, isLoading } = useRegionDistribution(days);

  const regions = data?.regions || {};
  const goianiaZones = data?.goianiaZones || [];
  const aparecidaZones = data?.aparecidaZones || [];
  const cities = data?.cities || [];
  const totalGeral = data?.totalGeral || 0;

  const regionList = useMemo(() => {
    return ["goiania", "aparecida", "restante", "nao_identificado"]
      .map((key) => ({ key, ...regions[key] }))
      .filter((r) => r.nome);
  }, [regions]);

  const sortedGoianiaZones = useMemo(() => [...goianiaZones].sort((a, b) => b.visitors - a.visitors), [goianiaZones]);
  const sortedAparecidaZones = useMemo(() => [...aparecidaZones].sort((a, b) => b.visitors - a.visitors), [aparecidaZones]);
  const maxGoianiaVisitors = Math.max(1, ...sortedGoianiaZones.map((z) => z.visitors));
  const maxAparecidaVisitors = Math.max(1, ...sortedAparecidaZones.map((z) => z.visitors));

  const bestRegion = useMemo(() => {
    const candidates = regionList.filter((r) => r.key !== "nao_identificado");
    return candidates.sort((a, b) => (b?.total || 0) - (a?.total || 0))[0];
  }, [regionList]);

  const handleExport = () => {
    const rows = [
      ...regionList.map((r) => ({
        Região: r.nome, Tipo: "Região", Visitantes: r.visitors, Formulários: r.forms,
        WhatsApp: r.whatsapp, Instagram: r.instagram, Facebook: r.facebook, "Total Interações": r.total,
      })),
      ...sortedGoianiaZones.map((z) => ({
        Região: `${z.zona.includes("Zona") ? z.zona : z.zona + " Zona"} - ${z.nome}`, Tipo: "Zona Goiânia", Visitantes: z.visitors, Formulários: z.forms,
        WhatsApp: z.whatsapp, Instagram: z.instagram, Facebook: z.facebook, "Total Interações": z.total,
      })),
      ...sortedAparecidaZones.map((z) => ({
        Região: `${z.zona} - ${z.nome}`, Tipo: "Zona Aparecida", Visitantes: z.visitors, Formulários: z.forms,
        WhatsApp: z.whatsapp, Instagram: z.instagram, Facebook: z.facebook, "Total Interações": z.total,
      })),
      ...cities.map((c) => ({
        Região: c.nome, Tipo: "Cidade Interior", Visitantes: c.visitors, Formulários: c.forms,
        WhatsApp: c.whatsapp, Instagram: c.instagram, Facebook: c.facebook, "Total Interações": c.total,
      })),
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Regiões Goiás");
    XLSX.writeFile(wb, `regioes_goias_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Regiões de Goiás</h1>
        <p className="text-sm text-muted-foreground">Visualize e compare o desempenho entre Goiânia, Aparecida de Goiânia e o restante do estado</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          {[{ label: "7d", d: 7 }, { label: "30d", d: 30 }, { label: "90d", d: 90 }].map((p) => (
            <button key={p.d} onClick={() => setDays(p.d)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${days === p.d ? "bg-primary text-primary-foreground" : "bg-white/[0.04] text-muted-foreground hover:text-foreground"}`}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {totalGeral > 0 && (
            <span className="text-[10px] text-muted-foreground">
              <strong className="text-foreground">{totalGeral.toLocaleString("pt-BR")}</strong> interações
            </span>
          )}
          <button onClick={handleExport} className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Download className="h-3 w-3" /> XLSX
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-white/[0.03] p-1 border border-white/[0.06]">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSelectedZona(null); }}
              className={`relative flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
              {isActive && (
                <motion.div layoutId="tab-bg" className="absolute inset-0 rounded-lg bg-primary" transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} />
              )}
              <tab.icon className="h-3.5 w-3.5 relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* ═══ TAB: GOIÂNIA ═══ */}
          {activeTab === "goiania" && (
            <motion.div key="goiania" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="space-y-4">
              {regions.goiania && (
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "#E8825C" }} />
                    <h3 className="text-sm font-bold">Goiânia — Resumo</h3>
                    <span className="ml-auto text-[10px] text-muted-foreground">{TOTAL_ELEITORES_GOIANIA.toLocaleString("pt-BR")} eleitores • 9 zonas</span>
                  </div>
                  <MetricGrid data={regions.goiania} size="lg" />
                </div>
              )}
              <div className="glass-card p-5">
                <h3 className="text-sm font-medium mb-4">Zonas Eleitorais de Goiânia</h3>
                <div className="space-y-1">
                  {sortedGoianiaZones.map((z, i) => (
                    <ZoneRow key={z.zona} z={z} i={i} maxVisitors={maxGoianiaVisitors}
                      isSelected={selectedZona === z.zona}
                      onSelect={() => setSelectedZona(selectedZona === z.zona ? null : z.zona)} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ TAB: APARECIDA (same architecture as Goiânia) ═══ */}
          {activeTab === "aparecida" && (
            <motion.div key="aparecida" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="space-y-4">
              {regions.aparecida && (
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "#FF6B8A" }} />
                    <h3 className="text-sm font-bold">Aparecida de Goiânia — Resumo</h3>
                    <span className="ml-auto text-[10px] text-muted-foreground">~{TOTAL_ELEITORES_APARECIDA.toLocaleString("pt-BR")} eleitores • 4 zonas</span>
                  </div>
                  <MetricGrid data={regions.aparecida} size="lg" />
                </div>
              )}
              <div className="glass-card p-5">
                <h3 className="text-sm font-medium mb-4">Zonas Eleitorais de Aparecida de Goiânia</h3>
                <div className="space-y-1">
                  {sortedAparecidaZones.map((z, i) => (
                    <ZoneRow key={z.zona} z={z} i={i} maxVisitors={maxAparecidaVisitors}
                      isSelected={selectedZona === z.zona}
                      onSelect={() => setSelectedZona(selectedZona === z.zona ? null : z.zona)} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ TAB: ESTADO (dynamic cities, no hardcoded filter) ═══ */}
          {activeTab === "estado" && (
            <motion.div key="estado" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="space-y-4">
              {regions.restante && (
                <div className="glass-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "#4DB8D4" }} />
                    <h3 className="text-sm font-bold">Demais Cidades de Goiás — Resumo</h3>
                    <span className="ml-auto text-[10px] text-muted-foreground">{cities.length} cidade{cities.length !== 1 ? "s" : ""} identificada{cities.length !== 1 ? "s" : ""}</span>
                  </div>
                  <MetricGrid data={regions.restante} size="lg" />
                </div>
              )}

              {cities.length > 0 ? (
                <div className="glass-card overflow-hidden">
                  <div className="p-5 border-b border-border">
                    <h3 className="text-sm font-medium">Todas as Cidades ({cities.length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="px-4 py-3 text-left font-medium w-8">#</th>
                          <th className="px-4 py-3 text-left font-medium">Cidade</th>
                          <th className="px-4 py-3 text-right font-medium">Visitantes</th>
                          <th className="px-4 py-3 text-right font-medium">Formulários</th>
                          <th className="px-4 py-3 text-right font-medium">WA</th>
                          <th className="px-4 py-3 text-right font-medium">IG</th>
                          <th className="px-4 py-3 text-right font-medium">FB</th>
                          <th className="px-4 py-3 text-right font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cities.map((c, i) => (
                          <tr key={c.nome} className={`border-b border-border/50 hover:bg-white/[0.02] ${i < 3 ? "bg-white/[0.01]" : ""}`}>
                            <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                              {i < 3 ? (
                                <Trophy className={`h-3.5 w-3.5 ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-400" : "text-amber-600"}`} />
                              ) : (
                                <span>{i + 1}</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 font-medium">
                              {c.nome}
                              {(c as any).estado && (
                                <span className="ml-1.5 text-[9px] text-muted-foreground/60 bg-white/[0.04] rounded px-1 py-0.5">{(c as any).estado}</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{c.visitors}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{c.forms}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-success">{c.whatsapp}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-primary">{c.instagram}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-blue-400">{c.facebook}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums font-bold">{c.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="glass-card p-8 text-center text-sm text-muted-foreground">
                  Nenhuma cidade do interior identificada no período selecionado.
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ TAB: COMPARATIVO ═══ */}
          {activeTab === "comparativo" && (() => {
            const allItems: { nome: string; origem: string; cor: string; visitors: number; forms: number; whatsapp: number; instagram: number; facebook: number; total: number }[] = [
              ...sortedGoianiaZones.filter(z => z.zona !== "Não identificada").map((z) => ({
                nome: z.zona.includes("Zona") ? `${z.zona} — ${z.nome}` : `${z.zona} Zona — ${z.nome}`, origem: "Goiânia", cor: z.cor,
                visitors: z.visitors, forms: z.forms, whatsapp: z.whatsapp, instagram: z.instagram, facebook: z.facebook, total: z.total,
              })),
              ...sortedAparecidaZones.filter(z => z.zona !== "Não identificada").map((z) => ({
                nome: `${z.zona} — ${z.nome}`, origem: "Aparecida", cor: z.cor,
                visitors: z.visitors, forms: z.forms, whatsapp: z.whatsapp, instagram: z.instagram, facebook: z.facebook, total: z.total,
              })),
              ...cities.map((c) => ({
                nome: c.nome, origem: "Interior", cor: "#4DB8D4",
                visitors: c.visitors, forms: c.forms, whatsapp: c.whatsapp, instagram: c.instagram, facebook: c.facebook, total: c.total,
              })),
            ].sort((a, b) => b.total - a.total);

            const top50 = allItems.slice(0, 50);
            const maxRankTotal = Math.max(1, top50[0]?.total || 1);
            const origemBadge: Record<string, string> = {
              "Goiânia": "bg-[#E8825C]/20 text-[#E8825C]",
              "Aparecida": "bg-[#FF6B8A]/20 text-[#FF6B8A]",
              "Interior": "bg-[#4DB8D4]/20 text-[#4DB8D4]",
            };


            return (
            <motion.div key="comparativo" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className="space-y-4">
              {/* ═══ RANKING UNIFICADO TOP 50 ═══ */}
              <div className="glass-card overflow-hidden">
                <div className="p-5 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-400" />
                      Ranking Geral — Top {Math.min(50, allItems.length)} Zonas e Cidades
                    </h3>
                    <span className="text-[10px] text-muted-foreground">{allItems.length} locais identificados</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="px-4 py-3 text-left font-medium w-8">#</th>
                        <th className="px-4 py-3 text-left font-medium">Zona / Cidade</th>
                        <th className="px-4 py-3 text-left font-medium">Origem</th>
                        <th className="px-4 py-3 text-right font-medium">Visit.</th>
                        <th className="px-4 py-3 text-right font-medium">Forms</th>
                        <th className="px-4 py-3 text-right font-medium">WA</th>
                        <th className="px-4 py-3 text-right font-medium">IG</th>
                        <th className="px-4 py-3 text-right font-medium">FB</th>
                        <th className="px-4 py-3 text-right font-medium">Total</th>
                        <th className="px-4 py-3 text-left font-medium w-32"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {top50.map((item, i) => {
                        const barPct = (item.total / maxRankTotal) * 100;
                        return (
                          <tr key={`${item.origem}-${item.nome}`} className={`border-b border-border/50 hover:bg-white/[0.02] ${i === 0 ? "bg-yellow-500/[0.04]" : i < 3 ? "bg-white/[0.01]" : ""}`}>
                            <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                              {i < 3 ? (
                                <Trophy className={`h-3.5 w-3.5 ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-400" : "text-amber-600"}`} />
                              ) : (
                                <span>{i + 1}</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.cor }} />
                                <span className="font-medium truncate max-w-[200px]">{item.nome}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${origemBadge[item.origem]}`}>
                                {item.origem}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{item.visitors}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{item.forms}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-success">{item.whatsapp}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-primary">{item.instagram}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-blue-400">{item.facebook}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums font-bold">{item.total}</td>
                            <td className="px-4 py-2.5">
                              <div className="h-1.5 w-full rounded-full bg-white/[0.04] overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${barPct}%` }}
                                  transition={{ duration: 0.5, delay: Math.min(i * 0.02, 0.5) }}
                                  className="h-full rounded-full" style={{ backgroundColor: item.cor }} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
            );
          })()}
        </AnimatePresence>
      )}
    </div>
  );
}
