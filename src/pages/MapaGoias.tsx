import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { REGIOES_GOIAS } from "@/lib/constants";
import { useRegionCounts } from "@/hooks/use-supabase-data";
import { AnimatedNumber } from "@/components/dashboard/AnimatedNumber";
import { X, Download } from "lucide-react";
import { mapRegiaoGoias, exportXlsx, exportFilename } from "@/lib/export-utils";

export default function MapaGoias() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [mode, setMode] = useState<"visitantes" | "formularios" | "engajamento">("visitantes");
  const regionCounts = useRegionCounts(30);

  // Merge real data with defined regions
  const regionsWithData = useMemo(() => {
    const data = regionCounts.data || {};
    return REGIOES_GOIAS.map((r) => {
      const match = data[r.nome] || { visitantes: 0, formularios: 0, cliques: 0 };
      return { ...r, ...match };
    });
  }, [regionCounts.data]);

  // Totals from real data
  const totalVisitantes = regionsWithData.reduce((s, r) => s + r.visitantes, 0);
  const totalForms = regionsWithData.reduce((s, r) => s + r.formularios, 0);
  const totalClicks = regionsWithData.reduce((s, r) => s + r.cliques, 0);

  // Regions with data that don't match any defined region
  const extraRegions = useMemo(() => {
    const data = regionCounts.data || {};
    const definedNames = new Set(REGIOES_GOIAS.map((r) => r.nome) as unknown as string[]);
    return Object.entries(data)
      .filter(([name]) => !definedNames.has(name) && name !== "Não identificada")
      .map(([nome, counts]) => ({ nome, cor: "#6B7280", ...counts }));
  }, [regionCounts.data]);

  const naoIdentificada = regionCounts.data?.["Não identificada"] || { visitantes: 0, formularios: 0, cliques: 0 };

  const getValue = (r: { visitantes: number; formularios: number; cliques: number }) =>
    mode === "visitantes" ? r.visitantes : mode === "formularios" ? r.formularios : r.cliques;
  const allRegions = [...regionsWithData, ...extraRegions];
  const maxValue = Math.max(1, ...allRegions.map(getValue));
  const selectedData = selectedRegion ? allRegions.find((r) => r.nome === selectedRegion) : null;

  const handleExport = () => {
    exportXlsx(exportFilename("MapaGoias_Regioes"), [
      { name: "Regiões de Planejamento", data: allRegions.map(mapRegiaoGoias) },
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Mapa Goiás</h1>
          <p className="text-sm text-muted-foreground">Alcance da campanha por região de planejamento — dados reais do banco</p>
        </div>
        <div className="flex gap-1">
          {(["visitantes", "formularios", "engajamento"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${mode === m ? "bg-primary text-primary-foreground" : "bg-white/[0.04] text-muted-foreground hover:text-foreground"}`}>
              {m === "visitantes" ? "Visitantes" : m === "formularios" ? "Formulários" : "Engajamento"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Visitantes GO</span><div className="text-xl font-bold"><AnimatedNumber value={totalVisitantes} /></div></div>
        <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Formulários GO</span><div className="text-xl font-bold"><AnimatedNumber value={totalForms} /></div></div>
        <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Cliques GO</span><div className="text-xl font-bold"><AnimatedNumber value={totalClicks} /></div></div>
        <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Não identificados</span><div className="text-xl font-bold"><AnimatedNumber value={getValue(naoIdentificada)} /></div></div>
      </div>

      {/* Regions Grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {allRegions.map((r, i) => {
          const val = getValue(r);
          const intensity = val / maxValue;
          return (
            <motion.button
              key={r.nome}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setSelectedRegion(selectedRegion === r.nome ? null : r.nome)}
              className={`glass-card-hover relative overflow-hidden p-4 text-left ${selectedRegion === r.nome ? "ring-2 ring-primary" : ""}`}
            >
              <div className="absolute top-0 left-0 h-1.5 w-full" style={{ backgroundColor: r.cor }} />
              <h4 className="text-xs font-medium text-foreground">{r.nome}</h4>
              <div className="mt-2 text-xl font-bold gold-text"><AnimatedNumber value={val} /></div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                {mode === "visitantes" ? "visitantes" : mode === "formularios" ? "formulários" : "cliques"}
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-white/[0.06]">
                <motion.div initial={{ width: 0 }} animate={{ width: `${intensity * 100}%` }} className="h-full rounded-full" style={{ backgroundColor: r.cor }} />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Selected Region Detail */}
      <AnimatePresence>
        {selectedData && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-foreground">{selectedData.nome}</h3>
              <button onClick={() => setSelectedRegion(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div><span className="text-xs text-muted-foreground">Visitantes</span><div className="text-lg font-bold">{selectedData.visitantes}</div></div>
              <div><span className="text-xs text-muted-foreground">Formulários</span><div className="text-lg font-bold">{selectedData.formularios}</div></div>
              <div><span className="text-xs text-muted-foreground">Cliques</span><div className="text-lg font-bold">{selectedData.cliques}</div></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Regions Table */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-sm font-medium">Tabela de Regiões</h3>
          <button onClick={handleExport} className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
            <Download className="h-3 w-3" /> XLSX
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Região</th>
                <th className="px-4 py-3 text-right font-medium">Visitantes</th>
                <th className="px-4 py-3 text-right font-medium">Formulários</th>
                <th className="px-4 py-3 text-right font-medium">Cliques</th>
              </tr>
            </thead>
            <tbody>
              {allRegions.map((r) => (
                <tr key={r.nome} className="border-b border-border/50 hover:bg-white/[0.02] cursor-pointer" onClick={() => setSelectedRegion(r.nome)}>
                  <td className="px-4 py-2.5"><span className="h-2.5 w-2.5 rounded-sm inline-block mr-2" style={{ backgroundColor: r.cor }} />{r.nome}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.visitantes}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.formularios}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.cliques}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
