import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3, Users, FileText, Layers, MousePointerClick, MapPin, Map, Download, Settings, LogOut, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AlertBell } from "@/components/shared/AlertBell";
import chamaRosaLogo from "@/assets/chama-rosa-logo.png";

const modules = [
  { path: "/", icon: BarChart3, label: "Visão Geral" },
  { path: "/visitantes", icon: Users, label: "Visitantes" },
  { path: "/formularios", icon: FileText, label: "Formulários" },
  { path: "/interacoes", icon: Layers, label: "Todas Interações" },
  { path: "/cliques", icon: MousePointerClick, label: "Cliques" },
  { path: "/zonas", icon: MapPin, label: "Zonas Goiânia" },
  { path: "/mapa-goias", icon: Map, label: "Mapa Goiás" },
  { path: "/exportar", icon: Download, label: "Exportar" },
  { path: "/configuracoes", icon: Settings, label: "Configurações" },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { signOut, user } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* Mobile bottom nav */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
        {modules.slice(0, 5).map((m) => {
          const active = location.pathname === m.path;
          return (
            <NavLink key={m.path} to={m.path} className="flex flex-1 flex-col items-center gap-0.5 py-2">
              <m.icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-[9px]", active ? "text-primary font-medium" : "text-muted-foreground")}>
                {m.label.split(" ")[0]}
              </span>
            </NavLink>
          );
        })}
      </div>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="hidden md:flex fixed inset-y-0 left-0 z-40 flex-col border-r border-border bg-sidebar"
      >
        {/* Header */}
        <div className="flex h-16 items-center gap-3 px-4 border-b border-border">
          <img src={chamaRosaLogo} alt="Chama Rosa" className="h-9 w-9 shrink-0 rounded-xl object-contain" />
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 flex-1">
              <h2 className="font-display text-lg font-bold leading-none text-foreground">Chama Rosa</h2>
              <div className="mt-0.5 flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-[10px] text-muted-foreground">Supabase conectado</span>
              </div>
            </motion.div>
          )}
          {!collapsed && <AlertBell />}
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {modules.map((m) => {
            const active = location.pathname === m.path;
            return (
              <NavLink
                key={m.path}
                to={m.path}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                  active
                    ? "bg-primary/10 text-primary rose-glow"
                    : "text-sidebar-foreground hover:bg-white/[0.04] hover:text-foreground"
                )}
              >
                <m.icon className={cn("h-4.5 w-4.5 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                {!collapsed && <span className="truncate">{m.label}</span>}
                {active && (
                  <motion.div layoutId="sidebar-active" className="absolute left-0 h-8 w-[3px] rounded-r-full bg-primary" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-3">
          {!collapsed && user && (
            <div className="mb-2 truncate rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-muted-foreground">
              {user.user_metadata?.username || user.email}
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={signOut}
              className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && "Sair"}
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-white/[0.04] transition-colors"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Spacer */}
      <motion.div
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="hidden md:block shrink-0"
      />
    </>
  );
}
