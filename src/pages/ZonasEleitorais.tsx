import { motion } from "framer-motion";
import { useState } from "react";
import { zonasEleitorais, totalEleitoresGoiania } from "@/lib/mock-data";
import { AnimatedNumber } from "@/components/dashboard/AnimatedNumber";
import { InfoTooltip } from "@/components/dashboard/InfoTooltip";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Download, AlertTriangle, TrendingUp, Target } from "lucide-react";

export default function ZonasEleitorais() {
  const [selectedZona, setSelectedZona] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"zonas" | "calor">("zonas");

  const totalVisitantes = zonasEleitorais.reduce((s, z) => s + z.visitantes, 0);
  const totalForms = zonasEleitorais.reduce((s, z) => s + z.formularios, 0);
  const avgPenetracao = (zonasEleitorais.reduce((s, z) => s + z.penetracao, 0) / zonasEleitorais.length).toFixed(2);

  const selectedData = selectedZona ? zonasEleitorais.find(z => z.zona === selectedZona) : null;
  const sortedByPenetracao = [...zonasEleitorais].sort((a, b) => b.penetracao - a.penetracao);
  const weakZones = sortedByPenetracao.filter(z => z.penetracao < parseFloat(avgPenetracao));

  // Strategic insights
  const strongestZone = sortedByPenetracao[0];
  const weakestZone = sortedByPenetracao[sortedByPenetracao.length - 1];
  const mostVoters = [...zonasEleitorais].sort((a, b) => b.eleitores - a.eleitores)[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Zonas Eleitorais de Goiânia</h1>
        <p className="text-sm text-muted-foreground">Módulo estratégico — 9 zonas eleitorais com {totalEleitoresGoiania.toLocaleString("pt-BR")} eleitores registrados</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="glass-card p-4">
          <span className="text-xs text-muted-foreground">Eleitores Goiânia</span>
          <div className="text-2xl font-bold gold-text"><AnimatedNumber value={totalEleitoresGoiania} /></div>
        </div>
        <div className="glass-card p-4">
          <span className="text-xs text-muted-foreground">Visitantes do Site</span>
          <div className="text-2xl font-bold text-foreground"><AnimatedNumber value={totalVisitantes} /></div>
        </div>
        <div className="glass-card p-4">
          <span className="text-xs text-muted-foreground">Formulários</span>
          <div className="text-2xl font-bold text-foreground"><AnimatedNumber value={totalForms} /></div>
        </div>
        <div className="glass-card p-4">
          <span className="text-xs text-muted-foreground">Penetração Média</span>
          <div className="text-2xl font-bold text-primary">{avgPenetracao}%</div>
        </div>
        <div className="glass-card p-4">
          <span className="text-xs text-muted-foreground">Zonas Monitoradas</span>
          <div className="text-2xl font-bold text-foreground"><AnimatedNumber value={9} /></div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-1">
        <button onClick={() => setViewMode("zonas")} className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors ${viewMode === "zonas" ? "bg-primary text-primary-foreground" : "bg-white/[0.04] text-muted-foreground"}`}>Mapa de Zonas</button>
        <button onClick={() => setViewMode("calor")} className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors ${viewMode === "calor" ? "bg-primary text-primary-foreground" : "bg-white/[0.04] text-muted-foreground"}`}>Mapa de Calor</button>
      </div>

      {/* Zone Grid */}
      <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
        {zonasEleitorais.map((z, i) => {
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
              <div className="absolute top-0 left-0 h-1.5 w-full" style={{ backgroundColor: viewMode === "calor" ? `hsl(341, 90%, ${75 - z.penetracao * 60}%)` : z.cor }} />
              <div className="text-lg font-bold" style={{ color: z.cor }}>{z.zona} Zona</div>
              <div className="mt-1 text-xs text-muted-foreground">{z.eleitores.toLocaleString("pt-BR")} eleitores</div>
              <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                <span className="text-muted-foreground">Visitantes</span><span className="text-right text-foreground tabular-nums">{z.visitantes}</span>
                <span className="text-muted-foreground">Forms</span><span className="text-right text-foreground tabular-nums">{z.formularios}</span>
                <span className="text-muted-foreground">Penetração</span><span className="text-right text-primary font-medium tabular-nums">{z.penetracao}%</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Selected Zone Detail */}
      {selectedData && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <h3 className="text-lg font-bold mb-3" style={{ color: selectedData.cor }}>{selectedData.zona} Zona Eleitoral</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-4">
            <div><span className="text-xs text-muted-foreground">Eleitores</span><div className="text-xl font-bold gold-text">{selectedData.eleitores.toLocaleString("pt-BR")}</div></div>
            <div><span className="text-xs text-muted-foreground">Visitantes</span><div className="text-xl font-bold">{selectedData.visitantes}</div></div>
            <div><span className="text-xs text-muted-foreground">WhatsApp</span><div className="text-xl font-bold">{selectedData.cliquesWhatsapp}</div></div>
            <div><span className="text-xs text-muted-foreground">Instagram</span><div className="text-xl font-bold">{selectedData.cliquesInstagram}</div></div>
          </div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Bairros desta zona:</h4>
          <div className="flex flex-wrap gap-1.5">
            {selectedData.bairros.map(b => (
              <span key={b} className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[10px] text-foreground/70">{b}</span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Comparison Table */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Comparativo de Zonas</h3>
          <button className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Download className="h-3 w-3" /> Exportar
          </button>
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
              {sortedByPenetracao.map(z => (
                <tr key={z.zona} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2.5"><span className="inline-block h-2.5 w-2.5 rounded-sm mr-2" style={{ backgroundColor: z.cor }} />{z.zona}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{z.eleitores.toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{z.visitantes}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{z.formularios}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{z.cliquesWhatsapp}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-medium text-primary">{z.penetracao}%</td>
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

      {/* Strategic Insights */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Insights Estratégicos</h3>
          <InfoTooltip text="Observações geradas automaticamente a partir dos dados das zonas eleitorais. Use para direcionar os esforços de campanha." />
        </div>
        <div className="space-y-2 text-xs text-foreground/80 leading-relaxed">
          <div className="flex items-start gap-2 rounded-lg bg-success/5 p-3">
            <TrendingUp className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <p>A <strong>{strongestZone.zona} Zona</strong> tem a maior penetração com {strongestZone.penetracao}%. Esta zona deve ser mantida e usada como referência de estratégia.</p>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-destructive/5 p-3">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p>A <strong>{mostVoters.zona} Zona</strong> tem o maior número de eleitores registrados com {mostVoters.eleitores.toLocaleString("pt-BR")} e está com penetração de apenas {mostVoters.penetracao}%. Esta zona deve ser priorizada nos próximos esforços de campanha.</p>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-secondary/5 p-3">
            <AlertTriangle className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
            <p>{weakZones.length} zonas estão abaixo da penetração média ({avgPenetracao}%): {weakZones.map(z => z.zona).join(", ")}. Considere ações focadas nestas áreas.</p>
          </div>
        </div>
      </motion.div>

      {/* Aparecida de Goiânia */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-medium text-foreground mb-3">Aparecida de Goiânia — Região Estratégica Adjacente</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div><span className="text-xs text-muted-foreground">Visitantes</span><div className="text-xl font-bold"><AnimatedNumber value={856} /></div></div>
          <div><span className="text-xs text-muted-foreground">Formulários</span><div className="text-xl font-bold"><AnimatedNumber value={62} /></div></div>
          <div><span className="text-xs text-muted-foreground">WhatsApp</span><div className="text-xl font-bold"><AnimatedNumber value={198} /></div></div>
          <div><span className="text-xs text-muted-foreground">Instagram</span><div className="text-xl font-bold"><AnimatedNumber value={145} /></div></div>
        </div>
      </div>
    </div>
  );
}
