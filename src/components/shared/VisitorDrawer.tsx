import { motion } from "framer-motion";
import { X, Smartphone, Monitor, Tablet } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EleitorScore } from "./EleitorScore";

const deviceIcon = { mobile: Smartphone, desktop: Monitor, tablet: Tablet };

interface VisitorDrawerProps {
  visitor: any;
  onClose: () => void;
}

export function VisitorDrawer({ visitor, onClose }: VisitorDrawerProps) {
  const DeviceIcon = deviceIcon[visitor.dispositivo as keyof typeof deviceIcon] || Smartphone;

  const formatTime = (seconds: number) => {
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}min`;
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed right-0 top-0 bottom-0 z-40 w-full max-w-md border-l border-white/[0.08] bg-background/95 backdrop-blur-xl overflow-y-auto"
    >
      <div className="p-5 space-y-5">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary mb-2">
              {visitor.cookieId.substring(3, 5).toUpperCase()}
            </div>
            <h3 className="text-sm font-bold text-foreground">{visitor.cookieId}</h3>
            <p className="text-xs text-muted-foreground">{visitor.cidade}, {visitor.estado}</p>
            <div className="mt-2">
              <EleitorScore flames={visitor.flames} size="md" />
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Visitas", value: visitor.totalVisitas },
            { label: "Zona Eleitoral", value: visitor.zonaEleitoral || "N/A", color: "text-primary" },
            { label: "Tempo Total", value: formatTime(visitor.tempoTotal) },
            { label: "Bairro", value: visitor.bairro || "N/A" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-white/[0.03] p-3">
              <span className="text-[10px] text-muted-foreground">{item.label}</span>
              <div className={`text-sm font-bold ${item.color || ""}`}>{item.value}</div>
            </div>
          ))}
        </div>

        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Dispositivo</h4>
          <div className="flex items-center gap-2 rounded-lg bg-white/[0.03] p-3">
            <DeviceIcon className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs font-medium capitalize">{visitor.dispositivo}</div>
              <div className="text-[10px] text-muted-foreground">{visitor.navegador} · {visitor.sistemaOperacional}</div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Primeira Visita</h4>
          <p className="text-xs text-foreground/80">{format(visitor.primeiraVisita, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}</p>
        </div>

        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Última Visita</h4>
          <p className="text-xs text-foreground/80">{format(visitor.ultimaVisita, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}</p>
        </div>

        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Páginas Visitadas</h4>
          <div className="space-y-1">
            {visitor.paginasVisitadas.map((p: string) => (
              <div key={p} className="rounded bg-white/[0.03] px-3 py-2 text-xs text-foreground/70 font-mono">{p}</div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Ações Realizadas</h4>
          <div className="flex flex-wrap gap-1.5">
            {visitor.acoes.length > 0 ? visitor.acoes.map((a: string) => (
              <span key={a} className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary">{a}</span>
            )) : <span className="text-xs text-muted-foreground">Nenhuma ação registrada</span>}
          </div>
        </div>

        {visitor.sessions && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Histórico de Sessões</h4>
            <div className="space-y-2">
              {visitor.sessions.map((s: any, i: number) => (
                <div key={i} className="rounded-lg bg-white/[0.03] p-3">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-foreground/70">{format(s.date, "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                    <span className="text-muted-foreground">{Math.floor(s.duration / 60)}min</span>
                  </div>
                  <div className="mt-1 flex gap-1">
                    {s.pages.map((p: string) => (
                      <span key={p} className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">{p}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
