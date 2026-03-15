import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, Monitor, Tablet, MessageCircle, Instagram, Eye, FileText } from "lucide-react";
import { generateActivityFeed } from "@/lib/mock-data";
import { useMemo } from "react";

const deviceIcon = { mobile: Smartphone, desktop: Monitor, tablet: Tablet };
const actionConfig = {
  visita: { icon: Eye, color: "bg-muted text-muted-foreground" },
  formulario: { icon: FileText, color: "bg-success/20 text-success" },
  whatsapp: { icon: MessageCircle, color: "bg-success/20 text-success" },
  instagram: { icon: Instagram, color: "bg-primary/20 text-primary" },
};

export function ActivityFeed() {
  const events = useMemo(() => generateActivityFeed(20), []);

  return (
    <div className="glass-card p-5">
      <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">Atividade Recente</h3>
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        <AnimatePresence>
          {events.map((evt, i) => {
            const DeviceIcon = deviceIcon[evt.dispositivo];
            const config = actionConfig[evt.tipo as keyof typeof actionConfig];
            const ActionIcon = config.icon;
            return (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/[0.03] transition-colors"
              >
                <div className={`rounded-full p-1.5 ${config.color}`}>
                  <ActionIcon className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-foreground/80 truncate block">
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
  );
}
