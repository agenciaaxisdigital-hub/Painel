import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { generateClickData, generateHourlyHeatmap, generateTimeSeriesData, zonasEleitorais } from "@/lib/mock-data";
import { AnimatedNumber } from "@/components/dashboard/AnimatedNumber";
import { InfoTooltip } from "@/components/dashboard/InfoTooltip";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { format } from "date-fns";

export default function Engajamento() {
  const clicks = useMemo(() => generateClickData(80), []);
  const heatmap = useMemo(() => generateHourlyHeatmap(), []);
  const timeData = useMemo(() => generateTimeSeriesData(30), []);

  const waClicks = clicks.filter(c => c.tipo === "whatsapp").length;
  const igClicks = clicks.filter(c => c.tipo === "instagram").length;

  // Clicks per zone
  const zoneClicks = useMemo(() => {
    return zonasEleitorais.map(z => ({
      zona: z.zona,
      cor: z.cor,
      whatsapp: clicks.filter(c => c.tipo === "whatsapp" && c.zonaEleitoral === z.zona).length,
      instagram: clicks.filter(c => c.tipo === "instagram" && c.zonaEleitoral === z.zona).length,
    })).sort((a, b) => (b.whatsapp + b.instagram) - (a.whatsapp + a.instagram));
  }, [clicks]);

  const dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const maxHeatVal = Math.max(...heatmap.map(h => h.valor));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Engajamento</h1>
        <p className="text-sm text-muted-foreground">Análise de cliques em WhatsApp e Instagram</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Cliques WhatsApp</span><div className="text-2xl font-bold text-success"><AnimatedNumber value={waClicks} /></div></div>
        <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Cliques Instagram</span><div className="text-2xl font-bold text-primary"><AnimatedNumber value={igClicks} /></div></div>
        <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Horário de Pico</span><div className="text-2xl font-bold gold-text">18h-21h</div></div>
        <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Cidade Líder</span><div className="text-2xl font-bold">Goiânia</div></div>
      </div>

      {/* Combined Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-medium">WhatsApp vs Instagram ao Longo do Tempo</h3>
          <InfoTooltip text="Compara a evolução dos cliques em cada canal. Mostra qual rede social gera mais engajamento direto." />
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 5%, 12%)" />
              <XAxis dataKey="date" stroke="hsl(240, 5%, 40%)" fontSize={11} />
              <YAxis stroke="hsl(240, 5%, 40%)" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(240, 15%, 8%)", border: "1px solid hsl(240, 5%, 15%)", borderRadius: "8px", fontSize: "12px" }} />
              <Legend />
              <Line type="monotone" dataKey="cliquesWhatsapp" name="WhatsApp" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cliquesInstagram" name="Instagram" stroke="hsl(341, 90%, 65%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Zone Breakdown */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-medium mb-3">Cliques por Zona Eleitoral</h3>
        <div className="space-y-2">
          {zoneClicks.map(z => (
            <div key={z.zona} className="flex items-center gap-3">
              <span className="inline-block h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: z.cor }} />
              <span className="text-xs text-foreground/80 w-16">{z.zona}</span>
              <div className="flex-1 flex gap-1">
                <div className="h-4 rounded-l bg-success/40" style={{ width: `${(z.whatsapp / Math.max(...zoneClicks.map(x => x.whatsapp + x.instagram))) * 100}%` }} />
                <div className="h-4 rounded-r bg-primary/40" style={{ width: `${(z.instagram / Math.max(...zoneClicks.map(x => x.whatsapp + x.instagram))) * 100}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground tabular-nums w-16 text-right">{z.whatsapp}W / {z.instagram}I</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hourly Heatmap */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-medium">Mapa de Calor por Horário</h3>
          <InfoTooltip text="Mostra em que horas do dia e dias da semana os cliques acontecem com mais frequência. Cores mais intensas = mais cliques naquele momento." />
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="flex gap-0.5 mb-1 pl-10">
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="flex-1 text-center text-[8px] text-muted-foreground">{h}</div>
              ))}
            </div>
            {dias.map(dia => (
              <div key={dia} className="flex gap-0.5 mb-0.5">
                <div className="w-9 text-[10px] text-muted-foreground flex items-center">{dia}</div>
                {Array.from({ length: 24 }, (_, h) => {
                  const val = heatmap.find(x => x.dia === dia && x.hora === h)?.valor || 0;
                  const intensity = val / maxHeatVal;
                  return (
                    <div key={h} className="flex-1 aspect-square rounded-sm transition-colors" style={{ backgroundColor: val === 0 ? "hsl(240, 5%, 8%)" : `hsl(341, 90%, ${Math.max(25, 65 - intensity * 40)}%)`, opacity: val === 0 ? 0.3 : 0.3 + intensity * 0.7 }} title={`${dia} ${h}h: ${val} cliques`} />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1 text-[9px] text-muted-foreground">
          <span>Menos</span>
          {[0, 0.25, 0.5, 0.75, 1].map(v => (
            <div key={v} className="h-3 w-3 rounded-sm" style={{ backgroundColor: v === 0 ? "hsl(240, 5%, 8%)" : `hsl(341, 90%, ${65 - v * 40}%)`, opacity: v === 0 ? 0.3 : 0.3 + v * 0.7 }} />
          ))}
          <span>Mais</span>
        </div>
      </motion.div>
    </div>
  );
}
