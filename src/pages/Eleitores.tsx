import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateVisitors, zonasEleitorais } from "@/lib/mock-data";
import { AnimatedNumber } from "@/components/dashboard/AnimatedNumber";
import { InfoTooltip } from "@/components/dashboard/InfoTooltip";
import { Search, X, Smartphone, Monitor, Tablet, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const deviceIcon = { mobile: Smartphone, desktop: Monitor, tablet: Tablet };

export default function Eleitores() {
  const visitors = useMemo(() => generateVisitors(100), []);
  const [search, setSearch] = useState("");
  const [selectedVisitor, setSelectedVisitor] = useState<string | null>(null);
  const [filterCity, setFilterCity] = useState("");

  const filtered = visitors.filter(v => {
    if (search && !v.cookieId.includes(search) && !v.cidade.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCity && v.cidade !== filterCity) return false;
    return true;
  });

  const selectedData = selectedVisitor ? visitors.find(v => v.id === selectedVisitor) : null;
  const cities = [...new Set(visitors.map(v => v.cidade))].sort();
  const avgVisits = (visitors.reduce((s, v) => s + v.totalVisitas, 0) / visitors.length).toFixed(1);
  const topCity = cities.sort((a, b) => visitors.filter(v => v.cidade === b).length - visitors.filter(v => v.cidade === a).length)[0];
  const returnRate = ((visitors.filter(v => v.totalVisitas > 1).length / visitors.length) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Eleitores</h1>
        <p className="text-sm text-muted-foreground">Perfis individuais de visitantes — visão CRM do eleitorado</p>
      </div>

      {/* Perfil do Eleitorado */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-medium text-foreground">Perfil do Eleitorado</h3>
          <InfoTooltip text="Dados agregados sobre o comportamento dos visitantes do site. Ajuda a entender quem é o eleitor que acessa a campanha online." />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <div><span className="text-xs text-muted-foreground">Média de Visitas</span><div className="text-xl font-bold">{avgVisits}</div></div>
          <div><span className="text-xs text-muted-foreground">Cidade Líder</span><div className="text-xl font-bold text-primary">{topCity}</div></div>
          <div><span className="text-xs text-muted-foreground">Dispositivo Principal</span><div className="text-xl font-bold">Mobile</div></div>
          <div><span className="text-xs text-muted-foreground">Taxa de Retorno</span><div className="text-xl font-bold gold-text">{returnRate}%</div></div>
          <div><span className="text-xs text-muted-foreground">Total Perfis</span><div className="text-xl font-bold"><AnimatedNumber value={visitors.length} /></div></div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por ID ou cidade..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white/[0.03] border-white/[0.08]" />
        </div>
        <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className="rounded-lg bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-sm text-foreground">
          <option value="">Todas as cidades</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <div className={`glass-card overflow-hidden flex-1 transition-all ${selectedData ? "lg:w-3/5" : "w-full"}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">Visitante</th>
                  <th className="px-4 py-3 text-left font-medium">Cidade</th>
                  <th className="px-4 py-3 text-left font-medium">Zona</th>
                  <th className="px-4 py-3 text-center font-medium">Disp.</th>
                  <th className="px-4 py-3 text-right font-medium">Visitas</th>
                  <th className="px-4 py-3 text-left font-medium">Última</th>
                  <th className="px-4 py-3 text-left font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 30).map((v) => {
                  const DeviceIcon = deviceIcon[v.dispositivo];
                  return (
                    <tr key={v.id} onClick={() => setSelectedVisitor(v.id)} className="border-b border-border/50 hover:bg-white/[0.03] cursor-pointer transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">{v.cookieId.substring(3, 5).toUpperCase()}</div>
                          <span className="text-foreground/70">{v.cookieId}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-foreground/80">{v.cidade}, {v.estado}</td>
                      <td className="px-4 py-2.5 text-primary">{v.zonaEleitoral || "—"}</td>
                      <td className="px-4 py-2.5 text-center"><DeviceIcon className="h-3.5 w-3.5 mx-auto text-muted-foreground" /></td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{v.totalVisitas}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{format(v.ultimaVisita, "dd/MM", { locale: ptBR })}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1">
                          {v.acoes.map(a => (
                            <span key={a} className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${a === "Formulário" ? "bg-success/10 text-success" : a === "WhatsApp" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}>{a}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Drawer */}
        <AnimatePresence>
          {selectedData && (
            <motion.div
              initial={{ opacity: 0, x: 30, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 380 }}
              exit={{ opacity: 0, x: 30, width: 0 }}
              className="hidden lg:block glass-card overflow-hidden shrink-0"
            >
              <div className="p-5 h-full overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary mb-2">{selectedData.cookieId.substring(3, 5).toUpperCase()}</div>
                    <h3 className="text-sm font-bold text-foreground">{selectedData.cookieId}</h3>
                    <p className="text-xs text-muted-foreground">{selectedData.cidade}, {selectedData.estado}</p>
                  </div>
                  <button onClick={() => setSelectedVisitor(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-white/[0.03] p-2.5">
                      <span className="text-[10px] text-muted-foreground">Visitas</span>
                      <div className="text-lg font-bold">{selectedData.totalVisitas}</div>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] p-2.5">
                      <span className="text-[10px] text-muted-foreground">Zona Eleitoral</span>
                      <div className="text-lg font-bold text-primary">{selectedData.zonaEleitoral || "N/A"}</div>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] p-2.5">
                      <span className="text-[10px] text-muted-foreground">Dispositivo</span>
                      <div className="text-sm font-medium capitalize">{selectedData.dispositivo}</div>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] p-2.5">
                      <span className="text-[10px] text-muted-foreground">Navegador</span>
                      <div className="text-sm font-medium">{selectedData.navegador}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">Primeira Visita</h4>
                    <p className="text-xs text-foreground/80">{format(selectedData.primeiraVisita, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">Páginas Visitadas</h4>
                    <div className="space-y-1">
                      {selectedData.paginasVisitadas.map(p => (
                        <div key={p} className="rounded bg-white/[0.03] px-2.5 py-1.5 text-xs text-foreground/70">{p}</div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">Ações Realizadas</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedData.acoes.length > 0 ? selectedData.acoes.map(a => (
                        <span key={a} className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary">{a}</span>
                      )) : <span className="text-xs text-muted-foreground">Nenhuma ação registrada</span>}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
