import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ZONAS_ELEITORAIS, TOTAL_ELEITORES_GOIANIA } from "@/lib/constants";
import { identifyZone } from "@/lib/zone-identification";
import { AnimatedNumber } from "@/components/dashboard/AnimatedNumber";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, TrendingUp, AlertTriangle, X, Download, MapPin, ChevronDown, ChevronRight } from "lucide-react";
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

function useRegionDistribution(days: number) {
  return useQuery({
    queryKey: ["region-distribution-goias", days],
    queryFn: async () => {
      const since = subDays(new Date(), days).toISOString();

      const [acessos, cliques, mensagens] = await Promise.all([
        supabase.from("acessos_site").select("zona_eleitoral, bairro, cidade, latitude, longitude").gte("criado_em", since).limit(5000),
        supabase.from("cliques_whatsapp").select("zona_eleitoral, bairro, cidade, latitude, longitude, tipo_clique").gte("criado_em", since).limit(5000),
        supabase.from("mensagens_contato").select("zona_eleitoral, bairro, cidade, latitude, longitude").gte("criado_em", since).limit(5000),
      ]);

      // Region accumulators
      const regions: Record<string, RegionData> = {
        goiania: { nome: "Goiânia", cor: "#E8825C", visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0, clicks: 0, total: 0 },
        aparecida: { nome: "Aparecida de Goiânia", cor: "#9CA3AF", visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0, clicks: 0, total: 0 },
        restante: { nome: "Restante de Goiás", cor: "#4DB8D4", visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0, clicks: 0, total: 0 },
        nao_identificado: { nome: "Não Identificado", cor: "#6B7280", visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0, clicks: 0, total: 0 },
      };

      // Zone-level data for Goiânia breakdown
      const zoneCounts: Record<string, { visitors: number; forms: number; whatsapp: number; instagram: number; facebook: number }> = {};
      ZONAS_ELEITORAIS.forEach((z) => {
        zoneCounts[z.zona] = { visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0 };
      });

      // City-level data for Restante de Goiás
      const cityCounts: Record<string, RegionData> = {};

      const goianiaNormalized = "goiania";
      const aparecidaNormalized = "aparecida de goiania";

      function normalize(s: string): string {
        return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      }

      function getRegion(r: any): string {
        const zone = identifyZone(r);
        const cidade = r.cidade ? normalize(r.cidade) : "";

        if (zone.method !== "unknown" && zone.zona !== "Não identificada" && zone.zona !== "Aparecida de Goiânia") {
          // It's a Goiânia zone
          return "goiania";
        }
        if (zone.zona === "Aparecida de Goiânia" || cidade === aparecidaNormalized) {
          return "aparecida";
        }
        if (cidade === goianiaNormalized || cidade.includes("goiania")) {
          return "goiania";
        }
        if (cidade && r.estado && normalize(r.estado).includes("goias")) {
          return "restante";
        }
        if (cidade) {
          return "restante"; // Any city = restante
        }
        return "nao_identificado";
      }

      function getZona(r: any): string | null {
        const zone = identifyZone(r);
        if (zone.method !== "unknown" && zone.zona !== "Não identificada" && zone.zona !== "Aparecida de Goiânia") {
          return zone.zona;
        }
        return null;
      }

      function getCityName(r: any): string {
        return r.cidade || "Desconhecida";
      }

      // Process acessos
      (acessos.data || []).forEach((r) => {
        const region = getRegion(r);
        regions[region].visitors++;
        regions[region].total++;

        const zona = getZona(r);
        if (zona && zoneCounts[zona]) zoneCounts[zona].visitors++;

        if (region === "restante") {
          const city = getCityName(r);
          if (!cityCounts[city]) cityCounts[city] = { nome: city, cor: "#4DB8D4", visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0, clicks: 0, total: 0 };
          cityCounts[city].visitors++;
          cityCounts[city].total++;
        }
      });

      // Process cliques
      (cliques.data || []).forEach((r) => {
        const region = getRegion(r);
        const tipo = (r as any).tipo_clique || "whatsapp";
        if (tipo === "instagram") { regions[region].instagram++; }
        else if (tipo === "facebook") { regions[region].facebook++; }
        else { regions[region].whatsapp++; }
        regions[region].clicks++;
        regions[region].total++;

        const zona = getZona(r);
        if (zona && zoneCounts[zona]) {
          if (tipo === "instagram") zoneCounts[zona].instagram++;
          else if (tipo === "facebook") zoneCounts[zona].facebook++;
          else zoneCounts[zona].whatsapp++;
        }

        if (region === "restante") {
          const city = getCityName(r);
          if (!cityCounts[city]) cityCounts[city] = { nome: city, cor: "#4DB8D4", visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0, clicks: 0, total: 0 };
          if (tipo === "instagram") cityCounts[city].instagram++;
          else if (tipo === "facebook") cityCounts[city].facebook++;
          else cityCounts[city].whatsapp++;
          cityCounts[city].clicks++;
          cityCounts[city].total++;
        }
      });

      // Process mensagens
      (mensagens.data || []).forEach((r) => {
        const region = getRegion(r);
        regions[region].forms++;
        regions[region].total++;

        const zona = getZona(r);
        if (zona && zoneCounts[zona]) zoneCounts[zona].forms++;

        if (region === "restante") {
          const city = getCityName(r);
          if (!cityCounts[city]) cityCounts[city] = { nome: city, cor: "#4DB8D4", visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0, clicks: 0, total: 0 };
          cityCounts[city].forms++;
          cityCounts[city].total++;
        }
      });

      // Build zone data with penetração
      const zones: ZoneData[] = ZONAS_ELEITORAIS.map((z) => {
        const c = zoneCounts[z.zona];
        const clicks = c.whatsapp + c.instagram + c.facebook;
        const total = c.visitors + c.forms + clicks;
        return {
          ...z, zona: z.zona,
          visitors: c.visitors, forms: c.forms, whatsapp: c.whatsapp, instagram: c.instagram, facebook: c.facebook,
          clicks, total,
          penetracao: z.eleitores > 0 ? parseFloat(((c.visitors / z.eleitores) * 100).toFixed(3)) : 0,
          conversao: c.visitors > 0 ? parseFloat(((c.forms / c.visitors) * 100).toFixed(1)) : 0,
        };
      });

      const cities = Object.values(cityCounts).sort((a, b) => b.total - a.total);

      const totalGeral = Object.values(regions).reduce((s, r) => s + r.total, 0);

      return { regions, zones, cities, totalGeral };
    },
    staleTime: 60_000,
  });
}

export default function ZonasGoiania() {
  const [days, setDays] = useState(30);
  const [expandedRegion, setExpandedRegion] = useState<string | null>("goiania");
  const [selectedZona, setSelectedZona] = useState<string | null>(null);
  const { data, isLoading } = useRegionDistribution(days);

  const regions = data?.regions || {};
  const zones = data?.zones || [];
  const cities = data?.cities || [];
  const totalGeral = data?.totalGeral || 0;

  const regionList = useMemo(() => {
    return ["goiania", "aparecida", "restante", "nao_identificado"]
      .map((key) => ({ key, ...regions[key] }))
      .filter((r) => r.nome && r.total > 0);
  }, [regions]);

  const maxRegionTotal = Math.max(1, ...regionList.map((r) => r.total));

  const sortedZones = useMemo(() => [...zones].sort((a, b) => b.visitors - a.visitors), [zones]);
  const maxZoneVisitors = Math.max(1, ...sortedZones.map((z) => z.visitors));

  const selectedZoneData = selectedZona ? zones.find((z) => z.zona === selectedZona) : null;

  const handleExport = () => {
    const rows = [
      ...regionList.map((r) => ({
        Região: r.nome, Tipo: "Região", Visitantes: r.visitors, Formulários: r.forms,
        WhatsApp: r.whatsapp, Instagram: r.instagram, Facebook: r.facebook, "Total Interações": r.total,
      })),
      ...sortedZones.map((z) => ({
        Região: `${z.zona} Zona - ${z.nome}`, Tipo: "Zona Goiânia", Visitantes: z.visitors, Formulários: z.forms,
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
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Regiões de Goiás</h1>
        <p className="text-sm text-muted-foreground">
          Comparativo de desempenho entre Goiânia, Aparecida de Goiânia e restante do estado
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          {[{ label: "7 dias", d: 7 }, { label: "30 dias", d: 30 }, { label: "90 dias", d: 90 }].map((p) => (
            <button key={p.d} onClick={() => setDays(p.d)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${days === p.d ? "bg-primary text-primary-foreground" : "bg-white/[0.04] text-muted-foreground hover:text-foreground"}`}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {totalGeral > 0 && (
            <span className="text-[10px] text-muted-foreground">
              <strong className="text-foreground">{totalGeral.toLocaleString("pt-BR")}</strong> interações no período
            </span>
          )}
          <button onClick={handleExport} className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
            <Download className="h-3 w-3" /> XLSX
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <>
          {/* Region Comparison Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {regionList.filter((r) => r.key !== "nao_identificado").map((r, i) => {
              const pct = totalGeral > 0 ? ((r.total / totalGeral) * 100).toFixed(1) : "0";
              const isExpanded = expandedRegion === r.key;
              return (
                <motion.div key={r.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={`glass-card-hover overflow-hidden cursor-pointer transition-all ${isExpanded ? "ring-1 ring-primary/40" : ""}`}
                  onClick={() => setExpandedRegion(isExpanded ? null : r.key)}>
                  <div className="h-1.5 w-full" style={{ backgroundColor: r.cor }} />
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" style={{ color: r.cor }} />
                        <h3 className="text-sm font-bold">{r.nome}</h3>
                      </div>
                      <span className="text-xs text-muted-foreground">{pct}%</span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 w-full rounded-full bg-white/[0.04] overflow-hidden mb-3">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(r.total / maxRegionTotal) * 100}%` }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                        className="h-full rounded-full" style={{ backgroundColor: r.cor }} />
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                      <div className="flex justify-between"><span className="text-muted-foreground">Visitantes</span><span className="tabular-nums font-medium">{r.visitors.toLocaleString("pt-BR")}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Formulários</span><span className="tabular-nums font-medium">{r.forms.toLocaleString("pt-BR")}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">WhatsApp</span><span className="tabular-nums text-success">{r.whatsapp}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Instagram</span><span className="tabular-nums text-primary">{r.instagram}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Facebook</span><span className="tabular-nums text-blue-400">{r.facebook}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="tabular-nums font-bold">{r.total.toLocaleString("pt-BR")}</span></div>
                    </div>

                    <div className="flex items-center justify-center mt-3 text-[10px] text-muted-foreground gap-1">
                      {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      {isExpanded ? "Clique para recolher" : "Clique para expandir"}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Expanded Region Detail */}
          <AnimatePresence>
            {expandedRegion === "goiania" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="glass-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium">Zonas Eleitorais de Goiânia</h3>
                    <span className="text-[10px] text-muted-foreground">{TOTAL_ELEITORES_GOIANIA.toLocaleString("pt-BR")} eleitores</span>
                  </div>
                  <div className="space-y-2">
                    {sortedZones.map((z, i) => {
                      const barPct = maxZoneVisitors > 0 ? (z.visitors / maxZoneVisitors) * 100 : 0;
                      const isSelected = selectedZona === z.zona;
                      return (
                        <div key={z.zona}>
                          <button onClick={() => setSelectedZona(isSelected ? null : z.zona)}
                            className={`w-full rounded-lg p-3 text-left transition-all hover:bg-white/[0.03] ${isSelected ? "bg-white/[0.04] ring-1 ring-primary/30" : ""}`}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: z.cor }} />
                                <span className="text-xs font-medium">{z.zona} Zona</span>
                                <span className="text-[10px] text-muted-foreground">— {z.nome}</span>
                              </div>
                              <div className="flex items-center gap-3 text-[10px] tabular-nums">
                                <span>{z.visitors} visit.</span>
                                <span className="text-success">{z.whatsapp} WA</span>
                                <span className="text-primary">{z.instagram} IG</span>
                                <span>{z.forms} forms</span>
                                <span className="text-primary font-medium">{z.penetracao}%</span>
                              </div>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-white/[0.04] overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${barPct}%` }}
                                transition={{ duration: 0.5, delay: i * 0.03 }}
                                className="h-full rounded-full" style={{ backgroundColor: z.cor }} />
                            </div>
                          </button>

                          {/* Zone detail */}
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden">
                                <div className="ml-5 mt-1 mb-2 rounded-lg bg-white/[0.02] border border-white/[0.06] p-4">
                                  <div className="grid grid-cols-3 gap-3 md:grid-cols-6 text-xs mb-3">
                                    <div><span className="text-muted-foreground">Eleitores</span><div className="font-bold gold-text">{z.eleitores.toLocaleString("pt-BR")}</div></div>
                                    <div><span className="text-muted-foreground">Visitantes</span><div className="font-bold">{z.visitors}</div></div>
                                    <div><span className="text-muted-foreground">Formulários</span><div className="font-bold">{z.forms}</div></div>
                                    <div><span className="text-muted-foreground">WhatsApp</span><div className="font-bold text-success">{z.whatsapp}</div></div>
                                    <div><span className="text-muted-foreground">Instagram</span><div className="font-bold text-primary">{z.instagram}</div></div>
                                    <div><span className="text-muted-foreground">Conversão</span><div className="font-bold">{z.conversao}%</div></div>
                                  </div>
                                  <div className="rounded-lg bg-white/[0.03] p-2.5 text-[11px] text-foreground/80">
                                    <Target className="h-3 w-3 text-primary inline mr-1" />
                                    <strong>{z.zona} Zona</strong> ({z.nome}) — {z.eleitores.toLocaleString("pt-BR")} eleitores, acesso de {z.penetracao}%.
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {expandedRegion === "restante" && cities.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="glass-card p-5">
                  <h3 className="text-sm font-medium mb-4">Cidades do Interior</h3>
                  <div className="space-y-2">
                    {cities.slice(0, 20).map((c, i) => {
                      const maxCity = cities[0]?.total || 1;
                      const barPct = (c.total / maxCity) * 100;
                      return (
                        <div key={c.nome} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium">{c.nome}</span>
                            <div className="flex items-center gap-3 tabular-nums text-[10px]">
                              <span>{c.visitors} visit.</span>
                              <span className="text-success">{c.whatsapp} WA</span>
                              <span>{c.forms} forms</span>
                              <span className="font-medium">{c.total} total</span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-white/[0.04] overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${barPct}%` }}
                              transition={{ duration: 0.5, delay: i * 0.03 }}
                              className="h-full rounded-full bg-accent" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {expandedRegion === "aparecida" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="glass-card p-5">
                  <h3 className="text-sm font-medium mb-3">Aparecida de Goiânia — Detalhamento</h3>
                  {regions.aparecida && (
                    <div className="grid grid-cols-3 gap-4 md:grid-cols-6 text-xs">
                      <div><span className="text-muted-foreground">Visitantes</span><div className="text-lg font-bold">{regions.aparecida.visitors}</div></div>
                      <div><span className="text-muted-foreground">Formulários</span><div className="text-lg font-bold">{regions.aparecida.forms}</div></div>
                      <div><span className="text-muted-foreground">WhatsApp</span><div className="text-lg font-bold text-success">{regions.aparecida.whatsapp}</div></div>
                      <div><span className="text-muted-foreground">Instagram</span><div className="text-lg font-bold text-primary">{regions.aparecida.instagram}</div></div>
                      <div><span className="text-muted-foreground">Facebook</span><div className="text-lg font-bold text-blue-400">{regions.aparecida.facebook}</div></div>
                      <div><span className="text-muted-foreground">Total</span><div className="text-lg font-bold">{regions.aparecida.total}</div></div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Comparison Table */}
          <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-border"><h3 className="text-sm font-medium">Tabela Comparativa — Todas as Regiões</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="px-4 py-3 text-left font-medium">Região</th>
                    <th className="px-4 py-3 text-right font-medium">Visitantes</th>
                    <th className="px-4 py-3 text-right font-medium">Forms</th>
                    <th className="px-4 py-3 text-right font-medium">WhatsApp</th>
                    <th className="px-4 py-3 text-right font-medium">Instagram</th>
                    <th className="px-4 py-3 text-right font-medium">Facebook</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                    <th className="px-4 py-3 text-right font-medium">% do Total</th>
                  </tr>
                </thead>
                <tbody>
                  {regionList.map((r) => (
                    <tr key={r.key} className="border-b border-border/50 hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: r.cor }} />
                          <span className="font-medium">{r.nome}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{r.visitors.toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{r.forms}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-success">{r.whatsapp}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-primary">{r.instagram}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-blue-400">{r.facebook}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-bold">{r.total.toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{totalGeral > 0 ? ((r.total / totalGeral) * 100).toFixed(1) : 0}%</td>
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr className="bg-white/[0.02] font-bold">
                    <td className="px-4 py-2.5">Total Geral</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{regionList.reduce((s, r) => s + r.visitors, 0).toLocaleString("pt-BR")}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{regionList.reduce((s, r) => s + r.forms, 0)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-success">{regionList.reduce((s, r) => s + r.whatsapp, 0)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-primary">{regionList.reduce((s, r) => s + r.instagram, 0)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-blue-400">{regionList.reduce((s, r) => s + r.facebook, 0)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{totalGeral.toLocaleString("pt-BR")}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
