import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateVisitors, generateHourlyHeatmap } from "@/lib/mock-data";
import { AnimatedNumber } from "@/components/dashboard/AnimatedNumber";
import { InfoTooltip } from "@/components/dashboard/InfoTooltip";
import { EleitorScore } from "@/components/shared/EleitorScore";
import { VisitorDrawer } from "@/components/shared/VisitorDrawer";
import { Trophy, Medal, Award } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const podiumIcons = [Trophy, Medal, Award];
const podiumColors = ["text-secondary", "text-muted-foreground", "text-amber-700"];

const formatTime = (seconds: number) => {
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}min`;
};

export function SecaoEleitoresFrequentes() {
  const visitors = useMemo(() => generateVisitors(200).sort((a, b) => b.totalVisitas - a.totalVisitas), []);
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);

  const topByVisits = visitors.slice(0, 10);
  const topByTime = [...visitors].sort((a, b) => b.tempoTotal - a.tempoTotal).slice(0, 10);
  const topByActions = [...visitors].sort((a, b) => b.acoes.length - a.acoes.length).slice(0, 10);

  // Frequent visitor patterns
  const hourData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, h) => ({
      hora: `${h}h`,
      acessos: h >= 8 && h <= 22 ? 5 + Math.floor(Math.random() * 15) : Math.floor(Math.random() * 5),
    }));
    return hours;
  }, []);

  const dayData = useMemo(() => {
    return ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((dia) => ({
      dia,
      acessos: dia === "Sáb" || dia === "Dom" ? 5 + Math.floor(Math.random() * 8) : 10 + Math.floor(Math.random() * 15),
    }));
  }, []);

  return (
    <section id="eleitores-frequentes" className="space-y-6 scroll-mt-16">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Eleitores Frequentes</h2>
        <p className="text-xs text-muted-foreground">Os apoiadores mais engajados da campanha digital</p>
      </div>

      {/* Three Leaderboards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[
          { title: "Mais Visitas", data: topByVisits, metric: (v: any) => `${v.totalVisitas} visitas`, tooltip: "Top 10 por acessos ao site." },
          { title: "Mais Tempo", data: topByTime, metric: (v: any) => formatTime(v.tempoTotal), tooltip: "Top 10 por tempo acumulado." },
          { title: "Mais Engajados", data: topByActions, metric: (v: any) => `${v.acoes.length} ações`, tooltip: "Top 10 por ações (formulários + cliques)." },
        ].map((board, bi) => (
          <motion.div key={board.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: bi * 0.1 }} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-medium">{board.title}</h3>
              <InfoTooltip text={board.tooltip} />
            </div>
            <div className="space-y-2">
              {board.data.map((v, i) => {
                const PodiumIcon = i < 3 ? podiumIcons[i] : null;
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVisitor(v)}
                    className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/[0.03] cursor-pointer transition-colors"
                  >
                    <div className="w-5 text-center">
                      {PodiumIcon ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.05, type: "spring" }}>
                          <PodiumIcon className={`h-3.5 w-3.5 ${podiumColors[i]}`} />
                        </motion.div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">{i + 1}</span>
                      )}
                    </div>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[9px] font-medium text-primary">
                      {v.cookieId.substring(3, 5).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-foreground/80 truncate">{v.cidade}</div>
                    </div>
                    <EleitorScore flames={v.flames} />
                    <span className="text-xs font-medium tabular-nums gold-text">{board.metric(v)}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Behavior Patterns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <h3 className="text-sm font-medium mb-3">Horários de Acesso — Frequentes</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 5%, 12%)" />
                <XAxis dataKey="hora" stroke="hsl(240, 5%, 40%)" fontSize={9} interval={2} />
                <YAxis stroke="hsl(240, 5%, 40%)" fontSize={10} />
                <Bar dataKey="acessos" fill="hsl(341, 90%, 65%)" radius={[2, 2, 0, 0]} />
                <Tooltip contentStyle={{ background: "hsl(240, 15%, 8%)", border: "1px solid hsl(240, 5%, 15%)", borderRadius: "8px", fontSize: "12px" }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <h3 className="text-sm font-medium mb-3">Dia da Semana — Frequentes</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 5%, 12%)" />
                <XAxis dataKey="dia" stroke="hsl(240, 5%, 40%)" fontSize={10} />
                <YAxis stroke="hsl(240, 5%, 40%)" fontSize={10} />
                <Bar dataKey="acessos" fill="hsl(45, 93%, 47%)" radius={[4, 4, 0, 0]} />
                <Tooltip contentStyle={{ background: "hsl(240, 15%, 8%)", border: "1px solid hsl(240, 5%, 15%)", borderRadius: "8px", fontSize: "12px" }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Top 50 Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="text-sm font-medium">Ranking dos 50 Mais Frequentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-4 py-3 text-center font-medium w-12">#</th>
                <th className="px-4 py-3 text-left font-medium">Visitante</th>
                <th className="px-4 py-3 text-left font-medium">Cidade</th>
                <th className="px-4 py-3 text-left font-medium">Zona</th>
                <th className="px-4 py-3 text-center font-medium">Score</th>
                <th className="px-4 py-3 text-right font-medium">Visitas</th>
                <th className="px-4 py-3 text-right font-medium">Tempo Total</th>
              </tr>
            </thead>
            <tbody>
              {visitors.slice(0, 50).map((v, i) => {
                const PodiumIcon = i < 3 ? podiumIcons[i] : null;
                return (
                  <tr
                    key={v.id}
                    onClick={() => setSelectedVisitor(v)}
                    className="border-b border-border/50 hover:bg-white/[0.03] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-2.5 text-center">
                      {PodiumIcon ? <PodiumIcon className={`h-4 w-4 mx-auto ${podiumColors[i]}`} /> : <span className="text-muted-foreground">{i + 1}</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">{v.cookieId.substring(3, 5).toUpperCase()}</div>
                        <span className="text-foreground/70">{v.cookieId}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-foreground/80">{v.cidade}</td>
                    <td className="px-4 py-2.5 text-primary">{v.zonaEleitoral || "—"}</td>
                    <td className="px-4 py-2.5"><EleitorScore flames={v.flames} /></td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium gold-text">{v.totalVisitas}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{formatTime(v.tempoTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedVisitor && <VisitorDrawer visitor={selectedVisitor} onClose={() => setSelectedVisitor(null)} />}
      </AnimatePresence>
    </section>
  );
}
