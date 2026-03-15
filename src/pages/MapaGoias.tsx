import { motion } from "framer-motion";
import { regioesGoias } from "@/lib/mock-data";
import { InfoTooltip } from "@/components/dashboard/InfoTooltip";
import { AnimatedNumber } from "@/components/dashboard/AnimatedNumber";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const modeLabels = { visitantes: "Visitantes", formularios: "Formulários", engajamento: "Engajamento" };

export default function MapaGoias() {
  const [mode, setMode] = useState<keyof typeof modeLabels>("visitantes");
  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const totalVisitantes = regioesGoias.reduce((s, r) => s + r.visitantes, 0);
  const totalFormularios = regioesGoias.reduce((s, r) => s + r.formularios, 0);

  const getIntensity = (r: typeof regioesGoias[0]) => {
    const max = Math.max(...regioesGoias.map(x => mode === "visitantes" ? x.visitantes : mode === "formularios" ? x.formularios : x.cliquesWhatsapp + x.cliquesInstagram));
    const val = mode === "visitantes" ? r.visitantes : mode === "formularios" ? r.formularios : r.cliquesWhatsapp + r.cliquesInstagram;
    return Math.max(0.2, val / max);
  };

  const filteredMunicipios = selectedRegion
    ? regioesGoias.find(r => r.nome === selectedRegion)?.municipios.filter(m => m.toLowerCase().includes(search.toLowerCase())) || []
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Mapa de Goiás</h1>
        <p className="text-sm text-muted-foreground">Distribuição geográfica por regiões de planejamento</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="glass-card p-4">
          <span className="text-xs text-muted-foreground">Total Visitantes GO</span>
          <div className="text-2xl font-bold text-foreground"><AnimatedNumber value={totalVisitantes} /></div>
        </div>
        <div className="glass-card p-4">
          <span className="text-xs text-muted-foreground">Formulários GO</span>
          <div className="text-2xl font-bold text-foreground"><AnimatedNumber value={totalFormularios} /></div>
        </div>
        <div className="glass-card p-4">
          <span className="text-xs text-muted-foreground">Regiões Ativas</span>
          <div className="text-2xl font-bold text-foreground"><AnimatedNumber value={8} /></div>
        </div>
        <div className="glass-card p-4">
          <span className="text-xs text-muted-foreground">Municípios Alcançados</span>
          <div className="text-2xl font-bold text-foreground"><AnimatedNumber value={regioesGoias.reduce((s, r) => s + r.municipios.length, 0)} /></div>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1">
        {(Object.entries(modeLabels) as [keyof typeof modeLabels, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setMode(key)} className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors ${mode === key ? "bg-primary text-primary-foreground" : "bg-white/[0.04] text-muted-foreground hover:text-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Region Grid as visual map alternative */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {regioesGoias.map((r, i) => (
          <motion.button
            key={r.nome}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setSelectedRegion(selectedRegion === r.nome ? null : r.nome)}
            className={`glass-card-hover relative overflow-hidden p-4 text-left transition-all ${selectedRegion === r.nome ? "ring-2 ring-primary" : ""}`}
            style={{ opacity: getIntensity(r) * 0.8 + 0.2 }}
          >
            <div className="absolute top-0 left-0 h-1 w-full" style={{ backgroundColor: r.cor }} />
            <h4 className="text-xs font-medium text-foreground">{r.nome}</h4>
            <div className="mt-2 text-xl font-bold gold-text">
              <AnimatedNumber value={mode === "visitantes" ? r.visitantes : mode === "formularios" ? r.formularios : r.cliquesWhatsapp + r.cliquesInstagram} />
            </div>
            <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>{r.municipios.length} municípios</span>
              <span>·</span>
              <span>{r.penetracao}% penetração</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Selected Region Detail */}
      {selectedRegion && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <h3 className="text-lg font-bold text-foreground mb-3">{selectedRegion}</h3>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar município..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white/[0.03] border-white/[0.08]" />
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {filteredMunicipios.map((m) => (
              <div key={m} className="rounded-lg bg-white/[0.03] px-3 py-2 text-xs">
                <span className="text-foreground/80">{m}</span>
                <div className="mt-1 text-muted-foreground">{10 + Math.floor(Math.random() * 200)} visitantes</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Full Municipalities Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Todos os Municípios</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Município</th>
                <th className="px-4 py-3 text-left font-medium">Região</th>
                <th className="px-4 py-3 text-right font-medium">Visitantes</th>
                <th className="px-4 py-3 text-right font-medium">Formulários</th>
                <th className="px-4 py-3 text-right font-medium">WhatsApp</th>
                <th className="px-4 py-3 text-left font-medium">Progresso</th>
              </tr>
            </thead>
            <tbody>
              {regioesGoias.flatMap(r =>
                r.municipios.slice(0, 3).map(m => {
                  const vis = 10 + Math.floor(Math.random() * 300);
                  return (
                    <tr key={`${r.nome}-${m}`} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-2.5 text-foreground/80">{m}</td>
                      <td className="px-4 py-2.5"><span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: r.cor }} />{r.nome.replace("Região ", "").split(" ").slice(0, 2).join(" ")}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{vis}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{Math.floor(vis * 0.07)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{Math.floor(vis * 0.15)}</td>
                      <td className="px-4 py-2.5">
                        <div className="h-1.5 w-24 rounded-full bg-white/[0.06]">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, vis / 3)}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
