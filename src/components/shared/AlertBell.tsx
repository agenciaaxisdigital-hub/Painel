import { useState } from "react";
import { Bell, AlertTriangle, TrendingUp, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const typeConfig = {
  warning: { icon: AlertTriangle, color: "text-secondary", bg: "bg-secondary/10" },
  success: { icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
  danger: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  info: { icon: Info, color: "text-primary", bg: "bg-primary/10" },
};

// Alerts are generated from data analysis — placeholder until real alert system
const defaultAlerts = [
  { id: "a1", type: "info" as const, message: "Sistema de alertas ativo. Monitorando dados do Site Principal.", time: "agora", read: false },
];

export function AlertBell() {
  const [open, setOpen] = useState(false);
  const [alerts] = useState(defaultAlerts);
  const unread = alerts.filter((a) => !a.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
            {unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border border-white/[0.08] bg-popover/95 backdrop-blur-xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
                <h4 className="text-sm font-medium text-foreground">Alertas</h4>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {alerts.map((alert) => {
                  const config = typeConfig[alert.type];
                  const Icon = config.icon;
                  return (
                    <div key={alert.id} className={`flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] ${!alert.read ? "bg-white/[0.02]" : ""}`}>
                      <div className={`mt-0.5 rounded-full p-1.5 ${config.bg}`}>
                        <Icon className={`h-3 w-3 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground/80 leading-relaxed">{alert.message}</p>
                        <span className="text-[10px] text-muted-foreground">{alert.time}</span>
                      </div>
                      {!alert.read && <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
