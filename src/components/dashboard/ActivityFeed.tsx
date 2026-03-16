import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, Monitor, Tablet, MessageCircle, Instagram, Eye, FileText, Facebook } from "lucide-react";
import { useRealtimeFeed, formatTempoAtras } from "@/hooks/use-supabase-data";

const deviceIcon: Record<string, any> = { mobile: Smartphone, desktop: Monitor, tablet: Tablet };
const actionConfig: Record<string, { icon: any; color: string }> = {
  visita: { icon: Eye, color: "bg-muted text-muted-foreground" },
  formulario: { icon: FileText, color: "bg-success/20 text-success" },
  whatsapp: { icon: MessageCircle, color: "bg-success/20 text-success" },
  instagram: { icon: Instagram, color: "bg-primary/20 text-primary" },
  facebook: { icon: Facebook, color: "bg-blue-500/20 text-blue-400" },
};

export function ActivityFeed() {
  const events = useRealtimeFeed();

  if (events.length === 0) {
    return (
      <div className="glass-card p-5">
        <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">Atividade Recente</h3>
        <p className="text-xs text-muted-foreground py-8 text-center">Aguardando dados do Site Principal...</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Atividade em Tempo Real</h3>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-[10px] text-muted-foreground">Ao vivo</span>
        </div>
      </div>
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        <AnimatePresence>
          {events.map((evt, i) => {
            const DeviceIcon = deviceIcon[evt.dispositivo] || Smartphone;
            const config = actionConfig[evt.tipo] || actionConfig.visita;
            const ActionIcon = config.icon;
            return (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/[0.03] transition-colors"
              >
                <div className={`rounded-full p-1.5 ${config.color}`}>
                  <ActionIcon className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-foreground/80 truncate block">
                    <span className="font-medium">{evt.cidade || "—"}</span> · {evt.label}
                  </span>
                </div>
                <DeviceIcon className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                <span className="text-[10px] text-muted-foreground/50 tabular-nums shrink-0">
                  {formatTempoAtras(evt.criado_em)}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
