import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ZONAS_ELEITORAIS, TOTAL_ELEITORES_GOIANIA } from "@/lib/constants";
import { identifyZone } from "@/lib/zone-identification";
import { AnimatedNumber } from "@/components/dashboard/AnimatedNumber";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Target, TrendingUp, AlertTriangle, X, Download, MapPin, Users, FileText, Phone } from "lucide-react";
import { format, subDays } from "date-fns";
import * as XLSX from "xlsx";

type SortField = "penetracao" | "eleitores" | "zona";

// Hook: fetch real zone distribution from all 3 tables
function useZoneDistribution(days: number) {
  return useQuery({
    queryKey: ["zone-distribution", days],
    queryFn: async () => {
      const since = subDays(new Date(), days).toISOString();

      const [acessos, cliques, mensagens] = await Promise.all([
        supabase.from("acessos_site").select("zona_eleitoral, bairro, cidade, latitude, longitude").gte("criado_em", since).limit(5000),
        supabase.from("cliques_whatsapp").select("zona_eleitoral, bairro, cidade, latitude, longitude, tipo_clique").gte("criado_em", since).limit(5000),
        supabase.from("mensagens_contato").select("zona_eleitoral, bairro, cidade, latitude, longitude").gte("criado_em", since).limit(5000),
      ]);

      // Initialize zone counts
      const zoneCounts: Record<string, { visitors: number; forms: number; whatsapp: number; instagram: number; facebook: number; identified: number; methods: Record<string, number> }> = {};
      ZONAS_ELEITORAIS.forEach((z) => {
        zoneCounts[z.zona] = { visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0, identified: 0, methods: {} };
      });
      zoneCounts["Aparecida de Goiânia"] = { visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0, identified: 0, methods: {} };
      zoneCounts["Não identificada"] = { visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0, identified: 0, methods: {} };

      let totalIdentified = 0;
      let totalRecords = 0;

      // Process acessos
      (acessos.data || []).forEach((r) => {
        totalRecords++;
        const zone = identifyZone(r);
        if (!zoneCounts[zone.zona]) zoneCounts[zone.zona] = { visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0, identified: 0, methods: {} };
        zoneCounts[zone.zona].visitors++;
        zoneCounts[zone.zona].methods[zone.method] = (zoneCounts[zone.zona].methods[zone.method] || 0) + 1;
        if (zone.method !== "unknown") totalIdentified++;
      });

      // Process cliques
      (cliques.data || []).forEach((r) => {
        totalRecords++;
        const zone = identifyZone(r);
        if (!zoneCounts[zone.zona]) zoneCounts[zone.zona] = { visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0, identified: 0, methods: {} };
        const tipo = (r as any).tipo_clique || "whatsapp";
        if (tipo === "instagram") zoneCounts[zone.zona].instagram++;
        else if (tipo === "facebook") zoneCounts[zone.zona].facebook++;
        else zoneCounts[zone.zona].whatsapp++;
        if (zone.method !== "unknown") totalIdentified++;
      });

      // Process mensagens
      (mensagens.data || []).forEach((r) => {
        totalRecords++;
        const zone = identifyZone(r);
        if (!zoneCounts[zone.zona]) zoneCounts[zone.zona] = { visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0, identified: 0, methods: {} };
        zoneCounts[zone.zona].forms++;
        if (zone.method !== "unknown") totalIdentified++;
      });

      return { zoneCounts, totalIdentified, totalRecords };
    },
    staleTime: 60_000,
  });
}

export default function ZonasGoiania() {
  const [selectedZona, setSelectedZona] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortField>("penetracao");
  const [days, setDays] = useState(30);
  const { data, isLoading } = useZoneDistribution(days);

  const zoneCounts = data?.zoneCounts || {};
  const totalIdentified = data?.totalIdentified ?? 0;
  const totalRecords = data?.totalRecords ?? 0;
  const identificationRate = totalRecords > 0 ? ((totalIdentified / totalRecords) * 100).toFixed(1) : "0";

  const zonesWithData = useMemo(() => {
    return ZONAS_ELEITORAIS.map((z) => {
      const counts = zoneCounts[z.zona] || { visitors: 0, forms: 0, whatsapp: 0, instagram: 0, facebook: 0, methods: {} };
      const clicks = counts.whatsapp + counts.instagram + counts.facebook;
      const penetracao = z.eleitores > 0 ? (counts.visitors / z.eleitores) * 100 : 0;
      const conversao = counts.visitors > 0 ? (counts.forms / counts.visitors) * 100 : 0;
      const totalInteractions = counts.visitors + counts.forms + clicks;
      return { ...z, visitors: counts.visitors, forms: counts.forms, clicks, penetracao: parseFloat(penetracao.toFixed(3)), conversao: parseFloat(conversao.toFixed(1)), totalInteractions, methods: counts.methods, whatsapp: counts.whatsapp, instagram: counts.instagram, facebook: counts.facebook };
    });
  }, [zoneCounts]);

  const sorted = useMemo(() => {
    return [...zonesWithData].sort((a, b) => {
      if (sortBy === "penetracao") return b.penetracao - a.penetracao;
      if (sortBy === "eleitores") return b.eleitores - a.eleitores;
      return a.zona.localeCompare(b.zona);
    });
  }, [zonesWithData, sortBy]);

  const avgPenetracao = zonesWithData.reduce((s, z) => s + z.penetracao, 0) / zonesWithData.length;
  const strongZones = sorted.filter((z) => z.penetracao >= avgPenetracao);
  const weakZones = sorted.filter((z) => z.penetracao < avgPenetracao);
  const selectedData = selectedZona ? zonesWithData.find((z) => z.zona === selectedZona) : null;
  const naoIdentificada = zoneCounts["Não identificada"];
  const aparecida = zoneCounts["Aparecida de Goiânia"];

  const getFlames = (pen: number): number => {
    if (pen >= avgPenetracao * 1.5) return 5;
    if (pen >= avgPenetracao * 1.2) return 4;
    if (pen >= avgPenetracao) return 3;
    if (pen >= avgPenetracao * 0.6) return 2;
    return 1;
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(sorted.map((z) => ({
      Zona: `${z.zona} Zona`, Nome: z.nome, Eleitores: z.eleitores, Visitantes: z.visitors,
      Formulários: z.forms, "Cliques WhatsApp": z.whatsapp, "Cliques Instagram": z.instagram,
      "Cliques Facebook": z.facebook, "Total Cliques": z.clicks, "Acesso %": z.penetracao, "Conversão %": z.conversao,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Zonas");
    XLSX.writeFile(wb, `zonas_goiania_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="text-4xl font-bold gold-text"><AnimatedNumber value={TOTAL_ELEITORES_GOIANIA} /></div>
        <p className="text-sm text-muted-foreground">eleitores em Goiânia — sua base eleitoral mapeada</p>
      </div>

      {/* Data quality + Controls */}
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
          {totalRecords > 0 && (
            <span className="text-[10px] text-muted-foreground">
              <strong className="text-foreground">{identificationRate}%</strong> dos registros com zona identificada ({totalIdentified}/{totalRecords})
            </span>
          )}
          <div className="flex gap-1">
            {([["penetracao", "Acesso"], ["eleitores", "Eleitores"], ["zona", "Zona"]] as [SortField, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setSortBy(key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${sortBy === key ? "bg-primary text-primary-foreground" : "bg-white/[0.04] text-muted-foreground hover:text-foreground"}`}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={handleExport} className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
            <Download className="h-3 w-3" /> XLSX
          </button>
        </div>
      </div>

      {/* Zone Cards */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 md:grid-cols-5 lg:grid-cols-9">
          {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 md:grid-cols-5 lg:grid-cols-9">
          {sorted.map((z, i) => {
            const flames = getFlames(z.penetracao);
            const isSelected = selectedZona === z.zona;
            return (
              <motion.button key={z.zona} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedZona(isSelected ? null : z.zona)}
                className={`glass-card-hover relative overflow-hidden p-3 text-left ${isSelected ? "ring-2 ring-primary" : ""}`}>
                <div className="absolute top-0 left-0 h-1.5 w-full" style={{ backgroundColor: z.cor }} />
                <div className="text-lg font-bold" style={{ color: z.cor }}>{z.zona}</div>
                <div className="text-[9px] text-foreground/60 leading-tight mb-1 line-clamp-2">{z.nome}</div>
                <div className="text-[10px] text-muted-foreground">{z.eleitores.toLocaleString("pt-BR")} eleitores</div>
                <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px]">
                  <span className="text-muted-foreground">Visit.</span><span className="text-right tabular-nums">{z.visitors}</span>
                  <span className="text-muted-foreground">Forms</span><span className="text-right tabular-nums">{z.forms}</span>
                  <span className="text-muted-foreground">Cliques</span><span className="text-right tabular-nums">{z.clicks}</span>
                  <span className="text-muted-foreground">Pen.</span><span className="text-right text-primary font-medium tabular-nums">{z.penetracao}%</span>
                </div>
                <div className="flex justify-center mt-1.5">
                  {Array.from({ length: flames }).map((_, fi) => (
                    <Flame key={fi} className="h-2.5 w-2.5 text-primary fill-primary" />
                  ))}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Extra zones row (Aparecida + Não identificada) */}
      {(aparecida || naoIdentificada) && (
        <div className="grid grid-cols-2 gap-3">
          {aparecida && (aparecida.visitors + aparecida.forms + aparecida.whatsapp) > 0 && (
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Aparecida de Goiânia</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div><span className="text-muted-foreground">Visitantes</span><div className="font-bold">{aparecida.visitors}</div></div>
                <div><span className="text-muted-foreground">Formulários</span><div className="font-bold">{aparecida.forms}</div></div>
                <div><span className="text-muted-foreground">Cliques</span><div className="font-bold">{aparecida.whatsapp + aparecida.instagram + aparecida.facebook}</div></div>
              </div>
            </div>
          )}
          {naoIdentificada && (naoIdentificada.visitors + naoIdentificada.forms) > 0 && (
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Zona Não Identificada</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div><span className="text-muted-foreground">Visitantes</span><div className="font-bold">{naoIdentificada.visitors}</div></div>
                <div><span className="text-muted-foreground">Formulários</span><div className="font-bold">{naoIdentificada.forms}</div></div>
                <div><span className="text-muted-foreground">Cliques</span><div className="font-bold">{naoIdentificada.whatsapp + naoIdentificada.instagram + naoIdentificada.facebook}</div></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Zone Detail */}
      <AnimatePresence>
        {selectedData && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-card p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold" style={{ color: selectedData.cor }}>{selectedData.zona} Zona Eleitoral</h3>
              <button onClick={() => setSelectedZona(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">{selectedData.nome}</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7 mb-4">
              <div><span className="text-xs text-muted-foreground">Eleitores</span><div className="text-lg font-bold gold-text">{selectedData.eleitores.toLocaleString("pt-BR")}</div></div>
              <div><span className="text-xs text-muted-foreground">Visitantes</span><div className="text-lg font-bold">{selectedData.visitors}</div></div>
              <div><span className="text-xs text-muted-foreground">Formulários</span><div className="text-lg font-bold">{selectedData.forms}</div></div>
              <div><span className="text-xs text-muted-foreground">WhatsApp</span><div className="text-lg font-bold text-success">{selectedData.whatsapp}</div></div>
              <div><span className="text-xs text-muted-foreground">Instagram</span><div className="text-lg font-bold text-primary">{selectedData.instagram}</div></div>
              <div><span className="text-xs text-muted-foreground">Acesso</span><div className="text-lg font-bold text-primary">{selectedData.penetracao}%</div></div>
              <div><span className="text-xs text-muted-foreground">Conversão</span><div className="text-lg font-bold">{selectedData.conversao}%</div></div>
            </div>
            {/* Identification methods */}
            {Object.keys(selectedData.methods).length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {Object.entries(selectedData.methods).map(([method, count]) => (
                  <span key={method} className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[10px] text-muted-foreground">
                    {method === "database" ? "Zona no banco" : method === "bairro" ? "Por bairro" : method === "coordinates" ? "Por coordenada" : method}: {count as number}
                  </span>
                ))}
              </div>
            )}
            <div className="rounded-lg bg-white/[0.03] p-3 text-xs text-foreground/80 leading-relaxed">
              <Target className="h-3.5 w-3.5 text-primary inline mr-1.5" />
              A <strong>{selectedData.zona} Zona</strong> ({selectedData.nome}) tem {selectedData.eleitores.toLocaleString("pt-BR")} eleitores e acesso de {selectedData.penetracao}%.
              {selectedData.penetracao < avgPenetracao
                ? " Zona abaixo da média — recomenda-se intensificar tráfego pago nesta região."
                : " Performance acima da média. Manter estratégia atual."}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Strategic Insights */}
      <div className="glass-card p-5 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">Insights Estratégicos</h3>
        </div>
        {strongZones.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg bg-success/5 p-3">
            <TrendingUp className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <p className="text-xs text-foreground/80">
              {strongZones.length} zona{strongZones.length > 1 ? "s" : ""} acima da média ({avgPenetracao.toFixed(3)}%): <strong>{strongZones.map((z) => `${z.zona} (${z.nome.split(" / ")[0]})`).join(", ")}</strong>.
            </p>
          </div>
        )}
        {weakZones.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/5 p-3">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-foreground/80">
              {weakZones.length} zona{weakZones.length > 1 ? "s" : ""} abaixo da média: <strong>{weakZones.map((z) => `${z.zona} (${z.nome.split(" / ")[0]})`).join(", ")}</strong>. Priorizar campanha nestas áreas.
            </p>
          </div>
        )}
        {totalRecords === 0 && (
          <div className="text-xs text-muted-foreground text-center py-4">
            Aguardando dados do Site Principal para gerar insights por zona.
          </div>
        )}
      </div>

      {/* Comparison Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-border"><h3 className="text-sm font-medium">Tabela Comparativa</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Zona</th>
                <th className="px-4 py-3 text-left font-medium">Região</th>
                <th className="px-4 py-3 text-right font-medium">Eleitores</th>
                <th className="px-4 py-3 text-right font-medium">Visitantes</th>
                <th className="px-4 py-3 text-right font-medium">Forms</th>
                <th className="px-4 py-3 text-right font-medium">WhatsApp</th>
                <th className="px-4 py-3 text-right font-medium">Instagram</th>
                <th className="px-4 py-3 text-right font-medium">Penetração</th>
                <th className="px-4 py-3 text-right font-medium">Conversão</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((z) => (
                <tr key={z.zona} className="border-b border-border/50 hover:bg-white/[0.02] cursor-pointer" onClick={() => setSelectedZona(z.zona)}>
                  <td className="px-4 py-2.5">
                    <span className="h-2.5 w-2.5 rounded-sm inline-block mr-2" style={{ backgroundColor: z.cor }} />
                    <span className="font-medium">{z.zona}</span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground max-w-[160px] truncate">{z.nome}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{z.eleitores.toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{z.visitors}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{z.forms}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-success">{z.whatsapp}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-primary">{z.instagram}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-primary font-medium">{z.penetracao}%</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{z.conversao}%</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      z.penetracao >= avgPenetracao ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                    }`}>{z.penetracao >= avgPenetracao ? "Forte" : "Priorizar"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
