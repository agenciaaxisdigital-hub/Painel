import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { regioesGoias, zonasEleitorais, totalEleitoresGoiania } from "@/lib/mock-data";
import { AnimatedNumber } from "@/components/dashboard/AnimatedNumber";
import { InfoTooltip } from "@/components/dashboard/InfoTooltip";
import { Search, Download, Target, TrendingUp, AlertTriangle, Flame, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { generateTimeSeriesData } from "@/lib/mock-data";
import * as XLSX from "xlsx";

const modeLabels = { visitantes: "Visitantes", formularios: "Formulários", engajamento: "Engajamento" };
const styleLabels = { regioes: "Mapa de Regiões", calor: "Mapa de Calor" };

export default function Mapas() {
  const [view, setView] = useState<"goias" | "zonas">("goias");
  const [mode, setMode] = useState<keyof typeof modeLabels>("visitantes");
  const [style, setStyle] = useState<"regioes" | "calor">("regioes");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedZona, setSelectedZona] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [zonePanel, setZonePanel] = useState(true);

  const timeData = useMemo(() => generateTimeSeriesData(30), []);

  const getRegionValue = (r: typeof regioesGoias[0]) => mode === "visitantes" ? r.visitantes : mode === "formularios" ? r.formularios : r.cliquesWhatsapp + r.cliquesInstagram;
  const maxRegionValue = Math.max(...regioesGoias.map(getRegionValue));
  const getZoneValue = (z: typeof zonasEleitorais[0]) => mode === "visitantes" ? z.visitantes : mode === "formularios" ? z.formularios : z.cliquesWhatsapp + z.cliquesInstagram;
  const maxZoneValue = Math.max(...zonasEleitorais.map(getZoneValue));

  const selectedRegionData = selectedRegion ? regioesGoias.find((r) => r.nome === selectedRegion) : null;
  const selectedZonaData = selectedZona ? zonasEleitorais.find((z) => z.zona === selectedZona) : null;

  const sortedZones = [...zonasEleitorais].sort((a, b) => b.penetracao - a.penetracao);
  const avgPenetracao = (zonasEleitorais.reduce((s, z) => s + z.penetracao, 0) / zonasEleitorais.length).toFixed(2);
  const weakZones = sortedZones.filter((z) => z.penetracao < parseFloat(avgPenetracao));

  const getFlameIntensity = (penetracao: number): number => {
    if (penetracao >= 0.46) return 5;
    if (penetracao >= 0.42) return 4;
    if (penetracao >= 0.38) return 3;
    if (penetracao >= 0.34) return 2;
    return 1;
  };

  const exportMunicipios = () => {
    const ws = XLSX.utils.json_to_sheet(
      regioesGoias.flatMap((r) =>
        r.municipios.map((m) => ({
          Município: m, Região: r.nome, Visitantes: Math.floor(r.visitantes / r.municipios.length),
          Formulários: Math.floor(r.formularios / r.municipios.length), WhatsApp: Math.floor(r.cliquesWhatsapp / r.municipios.length),
        }))
      )
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Municípios");
    XLSX.writeFile(wb, `municipios_goias_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  return (
    <div className="-m-4 md:-m-6 lg:-m-8">
      {/* Top Controls */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/50 px-4 md:px-6 lg:px-8 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggle */}
          <div className="flex gap-1 rounded-lg bg-white/[0.04] p-0.5">
            {(["goias", "zonas"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {v === "goias" ? "Mapa Goiás" : "Zonas Goiânia"}
              </button>
            ))}
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-1">
            {(Object.entries(modeLabels) as [keyof typeof modeLabels, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setMode(key)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${mode === key ? "bg-secondary text-secondary-foreground" : "bg-white/[0.04] text-muted-foreground hover:text-foreground"}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Style Toggle */}
          <div className="flex gap-1">
            {(Object.entries(styleLabels) as ["regioes" | "calor", string][]).map(([key, label]) => (
              <button key={key} onClick={() => setStyle(key)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${style === key ? "bg-white/[0.08] text-foreground" : "bg-white/[0.04] text-muted-foreground hover:text-foreground"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Map Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            {view === "goias" ? (
              <motion.div key="goias" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Visitantes GO</span><div className="text-xl font-bold"><AnimatedNumber value={regioesGoias.reduce((s, r) => s + r.visitantes, 0)} /></div></div>
                  <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Formulários GO</span><div className="text-xl font-bold"><AnimatedNumber value={regioesGoias.reduce((s, r) => s + r.formularios, 0)} /></div></div>
                  <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Regiões Ativas</span><div className="text-xl font-bold">8</div></div>
                  <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Municípios</span><div className="text-xl font-bold"><AnimatedNumber value={regioesGoias.reduce((s, r) => s + r.municipios.length, 0)} /></div></div>
                </div>

                {/* Regions Grid */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {regioesGoias.map((r, i) => {
                    const val = getRegionValue(r);
                    const intensity = val / Math.max(1, maxRegionValue);
                    return (
                      <motion.button
                        key={r.nome}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => setSelectedRegion(selectedRegion === r.nome ? null : r.nome)}
                        className={`glass-card-hover relative overflow-hidden p-4 text-left ${selectedRegion === r.nome ? "ring-2 ring-primary" : ""}`}
                      >
                        <div className="absolute top-0 left-0 h-1.5 w-full" style={{ backgroundColor: style === "calor" ? `hsl(341, 90%, ${75 - intensity * 50}%)` : r.cor }} />
                        <h4 className="text-xs font-medium text-foreground">{r.nome}</h4>
                        <div className="mt-2 text-xl font-bold gold-text"><AnimatedNumber value={val} /></div>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{r.municipios.length} municípios</span>
                          <span>·</span>
                          <span>{r.penetracao}% penetração</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Selected Region Detail */}
                <AnimatePresence>
                  {selectedRegionData && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-card p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-foreground">{selectedRegionData.nome}</h3>
                        <button onClick={() => setSelectedRegion(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-5 mb-4">
                        <div><span className="text-xs text-muted-foreground">Visitantes</span><div className="text-lg font-bold">{selectedRegionData.visitantes}</div></div>
                        <div><span className="text-xs text-muted-foreground">Formulários</span><div className="text-lg font-bold">{selectedRegionData.formularios}</div></div>
                        <div><span className="text-xs text-muted-foreground">WhatsApp</span><div className="text-lg font-bold">{selectedRegionData.cliquesWhatsapp}</div></div>
                        <div><span className="text-xs text-muted-foreground">Instagram</span><div className="text-lg font-bold">{selectedRegionData.cliquesInstagram}</div></div>
                        <div><span className="text-xs text-muted-foreground">Penetração</span><div className="text-lg font-bold text-primary">{selectedRegionData.penetracao}%</div></div>
                      </div>
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar município..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white/[0.03] border-white/[0.08]" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                        {selectedRegionData.municipios.filter((m) => m.toLowerCase().includes(search.toLowerCase())).map((m) => (
                          <div key={m} className="rounded-lg bg-white/[0.03] px-3 py-2 text-xs">
                            <span className="text-foreground/80">{m}</span>
                            <div className="mt-1 text-muted-foreground tabular-nums">{10 + Math.floor(Math.random() * 200)} visitantes</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Municipalities Table */}
                <div className="glass-card overflow-hidden">
                  <div className="flex items-center justify-between p-5 border-b border-border">
                    <h3 className="text-sm font-medium">Municípios de Goiás</h3>
                    <button onClick={exportMunicipios} className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <Download className="h-3 w-3" /> XLSX
                    </button>
                  </div>
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-card">
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="px-4 py-3 text-left font-medium">Município</th>
                          <th className="px-4 py-3 text-left font-medium">Região</th>
                          <th className="px-4 py-3 text-right font-medium">Visitantes</th>
                          <th className="px-4 py-3 text-right font-medium">Formulários</th>
                          <th className="px-4 py-3 text-left font-medium">Progresso</th>
                        </tr>
                      </thead>
                      <tbody>
                        {regioesGoias.flatMap((r) =>
                          r.municipios.slice(0, 5).map((m) => {
                            const vis = Math.floor(r.visitantes / r.municipios.length) + Math.floor(Math.random() * 50);
                            return (
                              <tr key={`${r.nome}-${m}`} className="border-b border-border/50 hover:bg-white/[0.02]">
                                <td className="px-4 py-2 text-foreground/80">{m}</td>
                                <td className="px-4 py-2"><span className="h-2 w-2 rounded-full inline-block mr-1.5" style={{ backgroundColor: r.cor }} />{r.nome.split(" ").slice(0, 2).join(" ")}</td>
                                <td className="px-4 py-2 text-right tabular-nums">{vis}</td>
                                <td className="px-4 py-2 text-right tabular-nums">{Math.floor(vis * 0.07)}</td>
                                <td className="px-4 py-2"><div className="h-1.5 w-20 rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, vis / 3)}%` }} /></div></td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="zonas" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                {/* Header */}
                <div className="text-center">
                  <div className="text-3xl font-bold gold-text"><AnimatedNumber value={totalEleitoresGoiania} /></div>
                  <p className="text-sm text-muted-foreground">Eleitores registrados em Goiânia · {format(new Date(), "dd/MM/yyyy")}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Visitantes</span><div className="text-xl font-bold"><AnimatedNumber value={zonasEleitorais.reduce((s, z) => s + z.visitantes, 0)} /></div></div>
                  <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Formulários</span><div className="text-xl font-bold"><AnimatedNumber value={zonasEleitorais.reduce((s, z) => s + z.formularios, 0)} /></div></div>
                  <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Penetração Média</span><div className="text-xl font-bold text-primary">{avgPenetracao}%</div></div>
                  <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Zonas</span><div className="text-xl font-bold">9</div></div>
                  <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Zona Líder</span><div className="text-xl font-bold gold-text">{sortedZones[0]?.zona}</div></div>
                </div>

                {/* Zone Grid */}
                <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
                  {zonasEleitorais.map((z, i) => {
                    const val = getZoneValue(z);
                    const intensity = val / Math.max(1, maxZoneValue);
                    const isSelected = selectedZona === z.zona;
                    return (
                      <motion.button
                        key={z.zona}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => setSelectedZona(isSelected ? null : z.zona)}
                        className={`glass-card-hover relative overflow-hidden p-3 text-left ${isSelected ? "ring-2 ring-primary" : ""}`}
                      >
                        <div className="absolute top-0 left-0 h-1.5 w-full" style={{ backgroundColor: style === "calor" ? `hsl(341, 90%, ${75 - intensity * 50}%)` : z.cor }} />
                        <div className="text-lg font-bold" style={{ color: z.cor }}>{z.zona}</div>
                        <div className="text-[10px] text-muted-foreground">{z.eleitores.toLocaleString("pt-BR")} eleitores</div>
                        <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px]">
                          <span className="text-muted-foreground">Visit.</span><span className="text-right tabular-nums">{z.visitantes}</span>
                          <span className="text-muted-foreground">Forms</span><span className="text-right tabular-nums">{z.formularios}</span>
                          <span className="text-muted-foreground">Pen.</span><span className="text-right text-primary font-medium tabular-nums">{z.penetracao}%</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Selected Zone Detail */}
                <AnimatePresence>
                  {selectedZonaData && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-card p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold" style={{ color: selectedZonaData.cor }}>{selectedZonaData.zona} Zona Eleitoral</h3>
                        <button onClick={() => setSelectedZona(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-5 mb-4">
                        <div><span className="text-xs text-muted-foreground">Eleitores</span><div className="text-lg font-bold gold-text">{selectedZonaData.eleitores.toLocaleString("pt-BR")}</div></div>
                        <div><span className="text-xs text-muted-foreground">Visitantes</span><div className="text-lg font-bold">{selectedZonaData.visitantes}</div></div>
                        <div><span className="text-xs text-muted-foreground">Formulários</span><div className="text-lg font-bold">{selectedZonaData.formularios}</div></div>
                        <div><span className="text-xs text-muted-foreground">WhatsApp</span><div className="text-lg font-bold">{selectedZonaData.cliquesWhatsapp}</div></div>
                        <div><span className="text-xs text-muted-foreground">Penetração</span><div className="text-lg font-bold text-primary">{selectedZonaData.penetracao}%</div></div>
                      </div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-2">Bairros:</h4>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {selectedZonaData.bairros.map((b) => (
                          <span key={b} className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[10px] text-foreground/70">{b}</span>
                        ))}
                      </div>
                      {/* Mini timeline */}
                      <h4 className="text-xs font-medium text-muted-foreground mb-2">Engajamento — 30 dias:</h4>
                      <div className="h-[150px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={timeData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 5%, 12%)" />
                            <XAxis dataKey="date" stroke="hsl(240, 5%, 40%)" fontSize={9} />
                            <YAxis stroke="hsl(240, 5%, 40%)" fontSize={9} />
                            <Line type="monotone" dataKey="visitantes" stroke={selectedZonaData.cor} strokeWidth={2} dot={false} />
                            <Tooltip contentStyle={{ background: "hsl(240, 15%, 8%)", border: "1px solid hsl(240, 5%, 15%)", borderRadius: "8px", fontSize: "11px" }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      {/* Strategic insight */}
                      <div className="mt-3 rounded-lg bg-white/[0.03] p-3 text-xs text-foreground/80 leading-relaxed">
                        <Target className="h-3.5 w-3.5 text-primary inline mr-1.5" />
                        A <strong>{selectedZonaData.zona} Zona</strong> tem {selectedZonaData.eleitores.toLocaleString("pt-BR")} eleitores e penetração de {selectedZonaData.penetracao}%.
                        {selectedZonaData.penetracao < 0.4 
                          ? ` Recomenda-se intensificar tráfego pago nos bairros ${selectedZonaData.bairros.slice(0, 2).join(" e ")} nesta zona.`
                          : ` Performance acima da média. Manter estratégia atual e usar como referência.`
                        }
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Zone Comparison Panel */}
                <div className="glass-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium">Comparativo de Zonas</h3>
                    <button onClick={() => setZonePanel(!zonePanel)} className="text-xs text-muted-foreground hover:text-foreground">
                      {zonePanel ? "Recolher" : "Expandir"}
                    </button>
                  </div>
                  {zonePanel && (
                    <div className="grid grid-cols-3 gap-2 md:grid-cols-5 lg:grid-cols-9">
                      {zonasEleitorais.map((z) => (
                        <button
                          key={z.zona}
                          onClick={() => setSelectedZona(z.zona)}
                          className="rounded-lg border border-white/[0.06] p-2 text-center hover:bg-white/[0.03] transition-colors"
                        >
                          <div className="h-2 w-full rounded-full mb-1.5" style={{ backgroundColor: z.cor }} />
                          <div className="text-xs font-bold" style={{ color: z.cor }}>{z.zona}</div>
                          <div className="text-[9px] text-muted-foreground">{z.eleitores.toLocaleString("pt-BR")}</div>
                          <div className="text-[9px] text-foreground/80">{z.visitantes} vis.</div>
                          <div className="text-[9px] text-primary tabular-nums">{z.penetracao}%</div>
                          <div className="flex justify-center mt-1">
                            {Array.from({ length: getFlameIntensity(z.penetracao) }).map((_, fi) => (
                              <Flame key={fi} className="h-2.5 w-2.5 text-primary fill-primary" />
                            ))}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Aparecida de Goiânia */}
                <div className="glass-card p-5">
                  <h3 className="text-sm font-medium mb-3">Aparecida de Goiânia — Região Estratégica</h3>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div><span className="text-xs text-muted-foreground">Visitantes</span><div className="text-xl font-bold"><AnimatedNumber value={856} /></div></div>
                    <div><span className="text-xs text-muted-foreground">Formulários</span><div className="text-xl font-bold"><AnimatedNumber value={62} /></div></div>
                    <div><span className="text-xs text-muted-foreground">WhatsApp</span><div className="text-xl font-bold"><AnimatedNumber value={198} /></div></div>
                    <div><span className="text-xs text-muted-foreground">Instagram</span><div className="text-xl font-bold"><AnimatedNumber value={145} /></div></div>
                  </div>
                </div>

                {/* Strategic Insights */}
                <div className="glass-card p-5 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-medium">Insights Estratégicos</h3>
                  </div>
                  <div className="flex items-start gap-2 rounded-lg bg-success/5 p-3">
                    <TrendingUp className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground/80">A <strong>{sortedZones[0]?.zona} Zona</strong> lidera com {sortedZones[0]?.penetracao}% de penetração. Usar como referência de estratégia.</p>
                  </div>
                  <div className="flex items-start gap-2 rounded-lg bg-destructive/5 p-3">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground/80">{weakZones.length} zonas abaixo da média ({avgPenetracao}%): {weakZones.map((z) => z.zona).join(", ")}. Priorizar campanha nestas áreas.</p>
                  </div>
                </div>

                {/* Comparison Table */}
                <div className="glass-card overflow-hidden">
                  <div className="p-5 border-b border-border">
                    <h3 className="text-sm font-medium">Tabela Comparativa</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="px-4 py-3 text-left font-medium">Zona</th>
                          <th className="px-4 py-3 text-right font-medium">Eleitores</th>
                          <th className="px-4 py-3 text-right font-medium">Visitantes</th>
                          <th className="px-4 py-3 text-right font-medium">Forms</th>
                          <th className="px-4 py-3 text-right font-medium">WhatsApp</th>
                          <th className="px-4 py-3 text-right font-medium">Penetração</th>
                          <th className="px-4 py-3 text-left font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedZones.map((z) => (
                          <tr key={z.zona} className="border-b border-border/50 hover:bg-white/[0.02] cursor-pointer" onClick={() => setSelectedZona(z.zona)}>
                            <td className="px-4 py-2.5"><span className="h-2.5 w-2.5 rounded-sm inline-block mr-2" style={{ backgroundColor: z.cor }} />{z.zona}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{z.eleitores.toLocaleString("pt-BR")}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{z.visitantes}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{z.formularios}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{z.cliquesWhatsapp}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-primary font-medium">{z.penetracao}%</td>
                            <td className="px-4 py-2.5">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${z.penetracao >= 0.45 ? "bg-success/10 text-success" : z.penetracao >= 0.35 ? "bg-secondary/10 text-secondary" : "bg-destructive/10 text-destructive"}`}>
                                {z.penetracao >= 0.45 ? "Forte" : z.penetracao >= 0.35 ? "Moderado" : "Priorizar"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
