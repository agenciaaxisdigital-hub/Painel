import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateActivityFeed, zonasEleitorais } from "@/lib/mock-data";
import { AnimatedNumber } from "@/components/dashboard/AnimatedNumber";
import { InfoTooltip } from "@/components/dashboard/InfoTooltip";
import { Radio, Smartphone, Monitor, Tablet, Eye, FileText, MessageCircle, Instagram } from "lucide-react";

const deviceIcon = { mobile: Smartphone, desktop: Monitor, tablet: Tablet };
const actionConfig = {
  visita: { icon: Eye, color: "bg-muted text-muted-foreground" },
  formulario: { icon: FileText, color: "bg-success/20 text-success" },
  whatsapp: { icon: MessageCircle, color: "bg-success/20 text-success" },
  instagram: { icon: Instagram, color: "bg-primary/20 text-primary" },
};

export default function TempoReal() {
  const [events, setEvents] = useState(generateActivityFeed(15));
  const [visitantesAgora, setVisitantesAgora] = useState(23);
  const [formsHoje, setFormsHoje] = useState(12);
  const [waHoje, setWaHoje] = useState(34);
  const [igHoje, setIgHoje] = useState(28);

  // Auto-refresh every 10s
  useEffect(() => {
    const interval = setInterval(() => {
      setEvents(generateActivityFeed(15));
      setVisitantesAgora(prev => prev + Math.floor(Math.random() * 5) - 2);
      setFormsHoje(prev => prev + (Math.random() > 0.7 ? 1 : 0));
      setWaHoje(prev => prev + (Math.random() > 0.5 ? 1 : 0));
      setIgHoje(prev => prev + (Math.random() > 0.6 ? 1 : 0));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Live zone indicators
  const liveZones = useMemo(() => {
    return zonasEleitorais.map(z => ({
      ...z,
      liveVisitors: Math.floor(Math.random() * 5),
    }));
  }, [events]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight">Tempo Real</h1>
        <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs text-success">
          <Radio className="h-3 w-3 animate-pulse" /> AO VIVO
        </div>
      </div>

      {/* Big Number */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card flex flex-col items-center justify-center p-12 text-center"
      >
        <span className="text-sm text-muted-foreground mb-2">Visitantes no site agora</span>
        <div className="text-7xl font-bold text-primary animate-pulse-slow">
          <AnimatedNumber value={Math.max(1, visitantesAgora)} />
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-muted-foreground">Atualiza a cada 10 segundos</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Live Feed */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            Feed ao Vivo
            <InfoTooltip text="Eventos acontecendo agora no site. Cada linha é uma ação real de um visitante." />
          </h3>
          <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
            <AnimatePresence>
              {events.map((evt, i) => {
                const DeviceIcon = deviceIcon[evt.dispositivo];
                const config = actionConfig[evt.tipo as keyof typeof actionConfig];
                const ActionIcon = config.icon;
                return (
                  <motion.div
                    key={evt.id}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/[0.03] transition-colors"
                  >
                    <div className={`rounded-full p-1.5 ${config.color}`}>
                      <ActionIcon className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-foreground/80 block truncate">
                        <span className="font-medium">{evt.cidade}</span> · {evt.acao}
                      </span>
                    </div>
                    <DeviceIcon className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                    <span className="text-[10px] text-muted-foreground/50 tabular-nums shrink-0">{evt.tempoAtras}</span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Live Zone Map */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            Zonas Ativas Agora
            <InfoTooltip text="Quais zonas eleitorais de Goiânia têm visitantes ativos neste momento." />
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {liveZones.map(z => (
              <div key={z.zona} className="relative rounded-lg border border-white/[0.06] p-3 text-center" style={{ backgroundColor: z.liveVisitors > 0 ? `${z.cor}15` : "transparent" }}>
                <div className="text-sm font-bold" style={{ color: z.cor }}>{z.zona}</div>
                <div className="text-lg font-bold text-foreground mt-1">{z.liveVisitors}</div>
                <div className="text-[9px] text-muted-foreground">online</div>
                {z.liveVisitors > 0 && (
                  <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-success animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Counters */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-5 text-center">
          <span className="text-xs text-muted-foreground">Formulários Hoje</span>
          <div className="text-3xl font-bold text-success mt-1"><AnimatedNumber value={formsHoje} /></div>
        </div>
        <div className="glass-card p-5 text-center">
          <span className="text-xs text-muted-foreground">WhatsApp Hoje</span>
          <div className="text-3xl font-bold text-success mt-1"><AnimatedNumber value={waHoje} /></div>
        </div>
        <div className="glass-card p-5 text-center">
          <span className="text-xs text-muted-foreground">Instagram Hoje</span>
          <div className="text-3xl font-bold text-primary mt-1"><AnimatedNumber value={igHoje} /></div>
        </div>
      </div>
    </div>
  );
}
