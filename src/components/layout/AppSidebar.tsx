import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3, Users, FileText, Layers, MapPin, Map, Download, Settings, LogOut, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AlertBell } from "@/components/shared/AlertBell";
import painelLogo from "@/assets/painel-logo.png";

const modules = [
  { path: "/", icon: BarChart3, label: "Visão Geral" },
  { path: "/interacoes", icon: Layers, label: "Interações" },
  { path: "/visitantes", icon: Users, label: "Visitantes" },
  { path: "/formularios", icon: FileText, label: "Formulários" },
  { path: "/zonas", icon: MapPin, label: "Regiões Goiás" },
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
      <div
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex overflow-x-auto scrollbar-hide">
          {modules.map((m) => {
            const active = location.pathname === m.path;
            return (
              <NavLink
                key={m.path}
                to={m.path}
                className="flex shrink-0 flex-col items-center gap-0.5 px-3 py-2 touch-manipulation"
              >
                <m.icon
                  className={cn(active ? "text-primary" : "text-muted-foreground")}
                  style={{ width: 22, height: 22, flexShrink: 0 }}
                />
                <span
                  className={cn(
                    "whitespace-nowrap",
                    active ? "text-primary font-semibold" : "text-muted-foreground"
                  )}
                  style={{ fontSize: "10px" }}
                >
                  {m.label.split(" ")[0]}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="hidden md:flex fixed inset-y-0 left-0 z-40 flex-col border-r border-border bg-sidebar overflow-hidden"
      >
        {/* Gradient top bar */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-pink-500 via-rose-400 to-pink-300" />

        {/* Header */}
        <div className="flex h-16 items-center gap-3 px-4 border-b border-border mt-[1.5px]">
          <div className="relative shrink-0">
            <img src={painelLogo} alt="Painel" className="h-9 w-9 rounded-xl object-contain" />
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar bg-emerald-500 animate-pulse" />
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 flex-1">
              <h2 className="text-sm font-bold leading-tight text-foreground tracking-tight">Painel de Dados</h2>
              <span className="text-[10px] text-muted-foreground">Supabase conectado</span>
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
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground hover:bg-primary/5 hover:text-foreground"
                )}
              >
                <m.icon
                  className={cn(
                    "shrink-0",
                    active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                  style={{ width: 18, height: 18 }}
                />
                {!collapsed && <span className="truncate">{m.label}</span>}
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 h-8 w-[3px] rounded-r-full bg-primary"
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-3">
          {!collapsed && user && (
            <div className="mb-2 truncate rounded-xl bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
              {user.user_metadata?.username || user.email}
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={signOut}
              className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && "Sair"}
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="rounded-xl p-2 text-muted-foreground hover:bg-primary/5 transition-colors"
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
