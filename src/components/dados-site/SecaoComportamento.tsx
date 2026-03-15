import { useMemo } from "react";
import { motion } from "framer-motion";
import { generateTimeSeriesData, topPagesData, behaviorData, trafficData } from "@/lib/mock-data";
import { AnimatedNumber } from "@/components/dashboard/AnimatedNumber";
import { InfoTooltip } from "@/components/dashboard/InfoTooltip";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export function SecaoComportamento() {
  const timeData = useMemo(() => generateTimeSeriesData(30), []);

  const timeOnSiteData = timeData.map((d) => ({
    date: d.date,
    tempo: (120 + Math.floor(Math.random() * 180)),
  }));

  const trafficOverTime = timeData.map((d) => ({
    date: d.date,
    Instagram: Math.floor(d.visitantes * 0.35),
    WhatsApp: Math.floor(d.visitantes * 0.28),
    Google: Math.floor(d.visitantes * 0.2),
    Direto: Math.floor(d.visitantes * 0.12),
    Outros: Math.floor(d.visitantes * 0.05),
  }));

  return (
    <section id="comportamento" className="space-y-6 scroll-mt-16">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Comportamento</h2>
        <p className="text-xs text-muted-foreground">Como os visitantes navegam e interagem com o site</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Página Mais Visitada</span><div className="text-lg font-bold text-primary">{behaviorData.paginaMaisVisitada}</div></div>
        <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Tempo Médio/Página</span><div className="text-lg font-bold">{behaviorData.tempoMedioPagina}</div></div>
        <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Taxa de Rejeição</span><div className="text-lg font-bold text-destructive">{behaviorData.taxaRejeicao}%</div></div>
        <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Scroll Médio</span><div className="text-lg font-bold gold-text">{behaviorData.scrollMedio}%</div></div>
        <div className="glass-card p-4"><span className="text-xs text-muted-foreground">Retornaram</span><div className="text-lg font-bold"><AnimatedNumber value={behaviorData.visitantesRetorno} /></div></div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Most visited pages */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-medium">Páginas Mais Visitadas</h3>
            <InfoTooltip text="Ranking de páginas com mais acessos." />
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPagesData} layout="vertical" margin={{ left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 5%, 12%)" horizontal={false} />
                <XAxis type="number" stroke="hsl(240, 5%, 40%)" fontSize={10} />
                <YAxis type="category" dataKey="pagina" stroke="hsl(240, 5%, 40%)" fontSize={10} tickLine={false} />
                <Bar dataKey="visitas" fill="hsl(341, 90%, 65%)" radius={[0, 4, 4, 0]} barSize={16} />
                <Tooltip contentStyle={{ background: "hsl(240, 15%, 8%)", border: "1px solid hsl(240, 5%, 15%)", borderRadius: "8px", fontSize: "12px" }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Time on site */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-medium">Tempo Médio no Site por Dia</h3>
            <InfoTooltip text="Tempo médio em segundos que os visitantes permanecem no site." />
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeOnSiteData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 5%, 12%)" />
                <XAxis dataKey="date" stroke="hsl(240, 5%, 40%)" fontSize={10} />
                <YAxis stroke="hsl(240, 5%, 40%)" fontSize={10} />
                <Line type="monotone" dataKey="tempo" stroke="hsl(45, 93%, 47%)" strokeWidth={2} dot={false} />
                <Tooltip contentStyle={{ background: "hsl(240, 15%, 8%)", border: "1px solid hsl(240, 5%, 15%)", borderRadius: "8px", fontSize: "12px" }} formatter={(v: number) => [`${Math.floor(v / 60)}m ${v % 60}s`, "Tempo"]} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Scroll Depth */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-medium">Profundidade de Scroll — Página Principal</h3>
            <InfoTooltip text="Percentual de visitantes que rolaram até cada ponto da página." />
          </div>
          <div className="space-y-3">
            {behaviorData.scrollDepth.map((sd) => (
              <div key={sd.depth} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-10">{sd.depth}</span>
                <div className="flex-1 h-6 rounded-lg bg-white/[0.04] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${sd.percentage}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="h-full rounded-lg bg-gradient-to-r from-primary/60 to-primary flex items-center justify-end pr-2"
                  >
                    <span className="text-[10px] font-bold text-primary-foreground">{sd.percentage}%</span>
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Traffic Origin Over Time */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-medium">Origem do Tráfego ao Longo do Tempo</h3>
            <InfoTooltip text="Evolução das fontes de tráfego ao longo dos dias." />
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 5%, 12%)" />
                <XAxis dataKey="date" stroke="hsl(240, 5%, 40%)" fontSize={10} />
                <YAxis stroke="hsl(240, 5%, 40%)" fontSize={10} />
                <Tooltip contentStyle={{ background: "hsl(240, 15%, 8%)", border: "1px solid hsl(240, 5%, 15%)", borderRadius: "8px", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Area type="monotone" dataKey="Instagram" stackId="1" fill="hsl(341, 90%, 65%)" stroke="hsl(341, 90%, 65%)" fillOpacity={0.3} />
                <Area type="monotone" dataKey="WhatsApp" stackId="1" fill="hsl(142, 71%, 45%)" stroke="hsl(142, 71%, 45%)" fillOpacity={0.3} />
                <Area type="monotone" dataKey="Google" stackId="1" fill="hsl(45, 93%, 47%)" stroke="hsl(45, 93%, 47%)" fillOpacity={0.3} />
                <Area type="monotone" dataKey="Direto" stackId="1" fill="hsl(200, 70%, 55%)" stroke="hsl(200, 70%, 55%)" fillOpacity={0.3} />
                <Area type="monotone" dataKey="Outros" stackId="1" fill="hsl(240, 5%, 64%)" stroke="hsl(240, 5%, 64%)" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
