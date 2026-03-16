import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ZONAS_ELEITORAIS, ZONAS_APARECIDA, TOTAL_ELEITORES_GOIANIA, TOTAL_ELEITORES_APARECIDA } from "@/lib/constants";
import { identifyZone } from "@/lib/zone-identification";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Download, MapPin, Trophy, BarChart3, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { format, subDays } from "date-fns";
import { mapRegiao, exportXlsx, exportFilename } from "@/lib/export-utils";

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

// ══════════════════════════════════════════════
// MAIN DATA HOOK — cookie-enriched, unified zone identification
// ══════════════════════════════════════════════
function useRegionDistribution(days: number) {
  return useQuery({
    queryKey: ["region-distribution-v5", days],
    queryFn: async () => {
      const since = subDays(new Date(), days).toISOString();
      const BRASIL_FILTER = "pais.eq.Brasil,pais.is.null";
      const SELECT_FIELDS = "zona_eleitoral, bairro, cidade, estado, latitude, longitude, cookie_visitante";

      const [acessos, cliques, mensagens] = await Promise.all([
        supabase.from("acessos_site").select(SELECT_FIELDS).gte("criado_em", since).or(BRASIL_FILTER).limit(5000),
        supabase.from("cliques_whatsapp").select(`${SELECT_FIELDS}, tipo_clique`).gte("criado_em", since).or(BRASIL_FILTER).limit(5000),
        supabase.from("mensagens_contato").select(SELECT_FIELDS).gte("criado_em", since).or(BRASIL_FILTER).limit(5000),
      ]);

      const allVisitantes = acessos.data || [];
      const allCliques = cliques.data || [];
      const allForms = mensagens.data || [];

      // ═══ BUG 2 FIX: Build bairro lookup from visitantes by cookie ═══
      const bairroMap: Record<string, string> = {};
      const cidadeMap: Record<string, { cidade: string; estado: string | null }> = {};
      allVisitantes.forEach((r: any) => {
        if (r.cookie_visitante) {
          if (r.bairro && r.bairro.trim()) {
            bairroMap[r.cookie_visitante] = r.bairro;
          }
          if (r.cidade && r.cidade.trim()) {
            cidadeMap[r.cookie_visitante] = { cidade: r.cidade, estado: r.estado };
          }
        }
      });

      // Enrich cliques and forms with bairro/cidade from visitantes
      const enrich = (r: any) => ({
        ...r,
        bairro: r.bairro || (r.cookie_visitante ? bairroMap[r.cookie_visitante] : null) || null,
        cidade: r.cidade || (r.cookie_visitante ? cidadeMap[r.cookie_visitante]?.cidade : null) || null,
        estado: r.estado || (r.cookie_visitante ? cidadeMap[r.cookie_visitante]?.estado : null) || null,
      });

      const enrichedCliques = allCliques.map(enrich);
      const enrichedForms = allForms.map(enrich);

      // Region summaries
      const regions: Record<string, RegionData> = {
        goiania: { nome: "Goiânia", cor: "#E8825C", visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0, clicks: 0, total: 0 },
        aparecida: { nome: "Aparecida de Goiânia", cor: "#FF6B8A", visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0, clicks: 0, total: 0 },
        restante: { nome: "Restante de Goiás", cor: "#4DB8D4", visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0, clicks: 0, total: 0 },
        
      };

      // Zone counters — Goiânia
      const goianiaZoneCounts: Record<string, { visitors: number; forms: number; whatsapp: number; instagram: number; facebook: number }> = {};
      ZONAS_ELEITORAIS.forEach((z) => { goianiaZoneCounts[z.zona] = { visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0 }; });
      

      // Zone counters — Aparecida
      const aparecidaZoneCounts: Record<string, { visitors: number; forms: number; whatsapp: number; instagram: number; facebook: number }> = {};
      ZONAS_APARECIDA.forEach((z) => { aparecidaZoneCounts[z.zona] = { visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0 }; });
      // No "Não identificada" for Aparecida — every Aparecida record goes to a zone

      // City counters for Estado (dynamic)
      const cityCountsMap: Record<string, RegionData & { estado?: string }> = {};

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
        if (!cityCountsMap[cityName]) {
          cityCountsMap[cityName] = { nome: cityName, cor: "#4DB8D4", visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0, clicks: 0, total: 0, estado: estado || undefined };
        }
        cityCountsMap[cityName][field]++;
        if (field === "whatsapp" || field === "instagram" || field === "facebook") cityCountsMap[cityName].clicks++;
        cityCountsMap[cityName].total++;
      }

      // ═══ UNIFIED zone identification — same function for all 3 tables ═══
      function processRecord(r: any, field: "visitors" | "forms" | "whatsapp" | "instagram" | "facebook") {
        const result = identifyZone(r);

        if (result.categoria === "goiania") {
          addToRegion("goiania", field);
          const zona = result.zona in goianiaZoneCounts ? result.zona : ZONAS_ELEITORAIS[0].zona;
          addToZone(goianiaZoneCounts, zona, field);
        } else if (result.categoria === "aparecida") {
          addToRegion("aparecida", field);
          const zona = result.zona in aparecidaZoneCounts ? result.zona : ZONAS_APARECIDA[3].zona;
          addToZone(aparecidaZoneCounts, zona, field);
        } else if ((result.categoria === "interior" || result.categoria === "fora_goias") && result.nome) {
          addToRegion("restante", field);
          addToCity(result.nome, r.estado, field);
        } else {
          // Fallback: assign to restante with the available info
          addToRegion("restante", field);
          if (r.cidade) addToCity(r.cidade, r.estado, field);
        }
      }

      // Process all records with unified logic
      allVisitantes.forEach((r) => processRecord(r, "visitors"));
      enrichedCliques.forEach((r) => {
        const tipo = (r as any).tipo_clique || "whatsapp";
        const field = tipo === "instagram" ? "instagram" : tipo === "facebook" ? "facebook" : "whatsapp";
        processRecord(r, field as any);
      });
      enrichedForms.forEach((r) => processRecord(r, "forms"));

      // ═══ VALIDATION ASSERTION ═══
      const totalGroupedAparecida = Object.values(aparecidaZoneCounts).reduce(
        (acc, z) => acc + z.visitors + z.forms + z.whatsapp + z.instagram + z.facebook, 0
      );
      const totalAparecidaRegion = regions.aparecida.total;
      console.assert(
        totalGroupedAparecida === totalAparecidaRegion,
        `APARECIDA COUNTING BUG: zones=${totalGroupedAparecida} region=${totalAparecidaRegion}`
      );

      const totalGroupedAll = Object.values(regions).reduce((s, r) => s + r.total, 0);
      const totalFetchedAll = allVisitantes.length + allCliques.length + allForms.length;
      console.assert(
        totalGroupedAll === totalFetchedAll,
        `GLOBAL COUNTING BUG: grouped=${totalGroupedAll} fetched=${totalFetchedAll}`
      );

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

      const goianiaNI = goianiaZoneCounts["Sem localização"];
      if (goianiaNI && (goianiaNI.visitors + goianiaNI.forms + goianiaNI.whatsapp + goianiaNI.instagram + goianiaNI.facebook) > 0) {
        const clicks = goianiaNI.whatsapp + goianiaNI.instagram + goianiaNI.facebook;
        goianiaZones.push({
          zona: "Sem localização", nome: "Sem localização", cor: "#E8825C", eleitores: 0,
          visitors: goianiaNI.visitors, forms: goianiaNI.forms, whatsapp: goianiaNI.whatsapp, instagram: goianiaNI.instagram, facebook: goianiaNI.facebook,
          clicks, total: goianiaNI.visitors + goianiaNI.forms + clicks, penetracao: 0,
          conversao: goianiaNI.visitors > 0 ? parseFloat(((goianiaNI.forms / goianiaNI.visitors) * 100).toFixed(1)) : 0,
        });
      }

      // Build zone arrays — Aparecida (every record assigned)
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

      const cities = Object.values(cityCountsMap).sort((a, b) => b.total - a.total);
      const totalGeral = Object.values(regions).reduce((s, r) => s + r.total, 0);

      // Debug data
      const debug = {
        fetchedVisitantes: allVisitantes.length,
        fetchedCliques: allCliques.length,
        fetchedForms: allForms.length,
        totalFetched: totalFetchedAll,
        totalGrouped: totalGroupedAll,
        goianiaTotal: regions.goiania.total,
        goianiaZoneSum: goianiaZones.reduce((s, z) => s + z.total, 0),
        aparecidaTotal: regions.aparecida.total,
        aparecidaZoneSum: aparecidaZones.reduce((s, z) => s + z.total, 0),
        aparecidaNaoIdentificada: 0, // No longer exists
        estadoCidades: cities.map((c) => c.nome),
        aparecidaZoneNames: ZONAS_APARECIDA.map((z) => z.zona),
        enrichedCount: enrichedCliques.filter((r: any) => r.bairro && !allCliques.find((o: any) => o.cookie_visitante === r.cookie_visitante && o.bairro)).length,
      };

      return { regions, goianiaZones, aparecidaZones, cities, totalGeral, debug };
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

/* ─── Zone Row — BUG 1 FIX: display z.zona directly, never append "Zona" ─── */
function ZoneRow({ z, i, maxVisitors, isSelected, onSelect }: {
  z: ZoneData; i: number; maxVisitors: number; isSelected: boolean; onSelect: () => void;
}) {
  const barPct = maxVisitors > 0 ? (z.visitors / maxVisitors) * 100 : 0;
  // BUG 1 FIX: For Goiânia zones like "1ª", append " Zona". For Aparecida zones already containing "Zona", use as-is.
  const displayZona = z.zona === "Sem localização" ? z.zona : z.zona.includes("Zona") ? z.zona : `${z.zona} Zona`;

  return (
    <div>
      <button onClick={onSelect}
        className={`w-full rounded-lg p-3 text-left transition-all hover:bg-white/[0.03] ${isSelected ? "bg-white/[0.04] ring-1 ring-primary/30" : ""}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: z.cor }} />
            <span className="text-xs font-medium">{displayZona}</span>
            {z.nome && z.zona !== "Sem localização" && <span className="text-[10px] text-muted-foreground">— {z.nome}</span>}
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

/* ─── Debug Validation Panel ─── */
function DebugPanel({ debug }: { debug: any }) {
  if (!debug) return null;

  const checks = [
    {
      label: "Goiânia total: soma zonas = região",
      pass: debug.goianiaZoneSum === debug.goianiaTotal,
      detail: `zonas=${debug.goianiaZoneSum} região=${debug.goianiaTotal}`,
    },
    {
      label: "Aparecida total: soma zonas = região",
      pass: debug.aparecidaZoneSum === debug.aparecidaTotal,
      detail: `zonas=${debug.aparecidaZoneSum} região=${debug.aparecidaTotal}`,
    },
    {
      label: "Aparecida zero sem localização",
      pass: debug.aparecidaNaoIdentificada === 0,
      warn: debug.aparecidaNaoIdentificada > 0,
      detail: `count=${debug.aparecidaNaoIdentificada}`,
    },
    {
      label: "Total agrupado = total buscado",
      pass: debug.totalGrouped === debug.totalFetched,
      detail: `grouped=${debug.totalGrouped} fetched=${debug.totalFetched}`,
    },
    {
      label: "No mocked data (fetched from Supabase)",
      pass: true,
      detail: `visitantes=${debug.fetchedVisitantes} cliques=${debug.fetchedCliques} forms=${debug.fetchedForms}`,
    },
  ];

  const zoneNameCheck = debug.aparecidaZoneNames.map((name: string) => ({
    name,
    hasDuplicateZona: (name.match(/Zona/gi) || []).length > 1,
  }));

  return (
    <div className="glass-card p-5 space-y-4 border-2 border-yellow-500/30">
      <h3 className="text-sm font-bold text-yellow-400">🔍 Painel de Validação (debug=1)</h3>

      <div className="space-y-2">
        {checks.map((c, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            {c.pass ? (
              <CheckCircle className="h-4 w-4 text-success shrink-0" />
            ) : (c as any).warn ? (
              <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive shrink-0" />
            )}
            <span className={c.pass ? "text-success" : (c as any).warn ? "text-yellow-400" : "text-destructive"}>
              {c.label}
            </span>
            <span className="text-muted-foreground ml-auto tabular-nums">{c.detail}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-medium text-foreground">Estado: {debug.estadoCidades.length} cidades</h4>
        <p className="text-[10px] text-muted-foreground">{debug.estadoCidades.join(", ") || "Nenhuma"}</p>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-medium text-foreground">Zone Name Check (Aparecida)</h4>
        {zoneNameCheck.map((z: any) => (
          <div key={z.name} className={`text-xs ${z.hasDuplicateZona ? "text-destructive font-bold" : "text-success"}`}>
            {z.hasDuplicateZona ? "❌" : "✅"} "{z.name}" {z.hasDuplicateZona && "— DUPLICATED 'Zona'!"}
          </div>
        ))}
      </div>

      <div className="text-[10px] text-muted-foreground">
        Enriched cliques via cookie: {debug.enrichedCount}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function ZonasGoiania() {
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState<TabKey>("goiania");
  const [selectedZona, setSelectedZona] = useState<string | null>(null);
  const { data, isLoading } = useRegionDistribution(days);

  const showDebug = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "1";

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
      ...regionList.map((r) => mapRegiao({ nome: r.nome, tipo: "Região", visitors: r.visitors, forms: r.forms, whatsapp: r.whatsapp, instagram: r.instagram, facebook: r.facebook, total: r.total })),
      ...sortedGoianiaZones.map((z) => mapRegiao({
        nome: `${z.zona.includes("Zona") ? z.zona : z.zona + " Zona"} — ${z.nome}`,
        tipo: "Zona Goiânia", visitors: z.visitors, forms: z.forms, whatsapp: z.whatsapp, instagram: z.instagram, facebook: z.facebook, total: z.total,
      })),
      ...sortedAparecidaZones.map((z) => mapRegiao({
        nome: `${z.zona} — ${z.nome}`,
        tipo: "Zona Aparecida", visitors: z.visitors, forms: z.forms, whatsapp: z.whatsapp, instagram: z.instagram, facebook: z.facebook, total: z.total,
      })),
      ...cities.map((c) => mapRegiao({ nome: c.nome, tipo: "Cidade Interior", visitors: c.visitors, forms: c.forms, whatsapp: c.whatsapp, instagram: c.instagram, facebook: c.facebook, total: c.total })),
    ];
    exportXlsx(exportFilename("Regioes_Goias"), [{ name: "Regiões Goiás", data: rows }]);
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

          {/* ═══ TAB: APARECIDA ═══ */}
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

          {/* ═══ TAB: ESTADO ═══ */}
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
              ...sortedGoianiaZones.filter(z => z.zona !== "Sem localização").map((z) => ({
                nome: z.zona.includes("Zona") ? `${z.zona} — ${z.nome}` : `${z.zona} Zona — ${z.nome}`, origem: "Goiânia", cor: z.cor,
                visitors: z.visitors, forms: z.forms, whatsapp: z.whatsapp, instagram: z.instagram, facebook: z.facebook, total: z.total,
              })),
              ...sortedAparecidaZones.map((z) => ({
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

      {/* Debug Validation Panel */}
      {showDebug && data?.debug && <DebugPanel debug={data.debug} />}
    </div>
  );
}
