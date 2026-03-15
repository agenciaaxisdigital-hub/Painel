import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { generateVisitors } from "@/lib/mock-data";
import { AnimatedNumber } from "@/components/dashboard/AnimatedNumber";
import { InfoTooltip } from "@/components/dashboard/InfoTooltip";
import { Trophy, Medal, Award, Smartphone, Monitor, Tablet, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const deviceIcon = { mobile: Smartphone, desktop: Monitor, tablet: Tablet };

export default function VisitantesFrequentes() {
  const visitors = useMemo(() => {
    const v = generateVisitors(200);
    return v.sort((a, b) => b.totalVisitas - a.totalVisitas);
  }, []);

  const topByVisits = visitors.slice(0, 10);
  const topByTime = [...visitors].sort((a, b) => b.tempoTotal - a.tempoTotal).slice(0, 10);
  const topByActions = [...visitors].sort((a, b) => b.acoes.length - a.acoes.length).slice(0, 10);

  const podiumIcons = [Trophy, Medal, Award];
  const podiumColors = ["text-secondary", "text-muted-foreground", "text-amber-700"];

  const formatTime = (seconds: number) => {
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}min`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Visitantes Frequentes</h1>
        <p className="text-sm text-muted-foreground">Os apoiadores mais engajados da campanha digital</p>
      </div>

      {/* Top 50 Ranking */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">Ranking dos 50 Mais Frequentes</h3>
            <InfoTooltip text="Lista dos visitantes que mais acessaram o site. São potenciais apoiadores engajados que podem ser mobilizados pela campanha." />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-4 py-3 text-center font-medium w-12">#</th>
                <th className="px-4 py-3 text-left font-medium">Visitante</th>
                <th className="px-4 py-3 text-left font-medium">Cidade</th>
                <th className="px-4 py-3 text-left font-medium">Zona</th>
                <th className="px-4 py-3 text-right font-medium">Visitas</th>
                <th className="px-4 py-3 text-right font-medium">Tempo Total</th>
                <th className="px-4 py-3 text-left font-medium">Primeira Visita</th>
                <th className="px-4 py-3 text-left font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {visitors.slice(0, 50).map((v, i) => {
                const DeviceIcon = deviceIcon[v.dispositivo];
                const PodiumIcon = i < 3 ? podiumIcons[i] : null;
                return (
                  <motion.tr
                    key={v.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-border/50 hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="px-4 py-2.5 text-center">
                      {PodiumIcon ? <PodiumIcon className={`h-4 w-4 mx-auto ${podiumColors[i]}`} /> : <span className="text-muted-foreground">{i + 1}</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">{v.cookieId.substring(3, 5).toUpperCase()}</div>
                        <span className="text-foreground/70">{v.cookieId}</span>
                        <DeviceIcon className="h-3 w-3 text-muted-foreground/50" />
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-foreground/80">{v.cidade}</td>
                    <td className="px-4 py-2.5 text-primary">{v.zonaEleitoral || "—"}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium gold-text">{v.totalVisitas}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{formatTime(v.tempoTotal)}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{format(v.primeiraVisita, "dd/MM/yy", { locale: ptBR })}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1">
                        {v.acoes.map(a => (
                          <span key={a} className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${a === "Formulário" ? "bg-success/10 text-success" : a === "WhatsApp" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}>{a}</span>
                        ))}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Three Leaderboards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[
          { title: "Mais Visitas", data: topByVisits, metric: (v: any) => `${v.totalVisitas} visitas`, tooltip: "Top 10 por número total de acessos ao site." },
          { title: "Mais Tempo", data: topByTime, metric: (v: any) => formatTime(v.tempoTotal), tooltip: "Top 10 por tempo total acumulado no site." },
          { title: "Mais Engajados", data: topByActions, metric: (v: any) => `${v.acoes.length} ações`, tooltip: "Top 10 por número de ações realizadas (formulários + cliques)." },
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
                  <div key={v.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/[0.03] transition-colors">
                    <div className="w-5 text-center">
                      {PodiumIcon ? <PodiumIcon className={`h-3.5 w-3.5 ${podiumColors[i]}`} /> : <span className="text-[10px] text-muted-foreground">{i + 1}</span>}
                    </div>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[9px] font-medium text-primary">{v.cookieId.substring(3, 5).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-foreground/80 truncate">{v.cidade}</div>
                    </div>
                    <span className="text-xs font-medium tabular-nums gold-text">{board.metric(v)}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
