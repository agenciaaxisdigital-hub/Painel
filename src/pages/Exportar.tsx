import { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileSpreadsheet, Calendar, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { mapFormulario, mapVisitante, mapClique, exportXlsx, exportFilename } from "@/lib/export-utils";
import { filterValidLocationRecords } from "@/lib/location-validity";

const dataTypes = [
  { id: "formularios", label: "Formulários", description: "Todas as submissões com dados completos de localização, contato e UTM" },
  { id: "visitantes", label: "Visitantes", description: "Acessos ao site com dispositivo, origem, localização e dados de sessão" },
  { id: "cliques", label: "Cliques", description: "Cliques em WhatsApp, Instagram e Facebook com localização completa" },
  { id: "todos", label: "Tudo Combinado", description: "Exportação completa — cada tabela em uma aba separada" },
];

export default function Exportar() {
  const [selectedType, setSelectedType] = useState("formularios");
  const [dateRange, setDateRange] = useState("30");
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const since = dateRange === "all" ? undefined : new Date(Date.now() - parseInt(dateRange) * 86400000).toISOString();
      const sheets: { name: string; data: any[] }[] = [];

      if (selectedType === "formularios" || selectedType === "todos") {
        let query = supabase.from("mensagens_contato").select("*").or("pais.eq.Brasil,pais.is.null").order("criado_em", { ascending: false }).limit(5000);
        if (since) query = query.gte("criado_em", since);
        const { data } = await query;
        const validData = filterValidLocationRecords(data);
        if (validData.length > 0) sheets.push({ name: "Formulários", data: validData.map(mapFormulario) });
      }

      if (selectedType === "visitantes" || selectedType === "todos") {
        let query = supabase.from("acessos_site").select("*").or("pais.eq.Brasil,pais.is.null").order("criado_em", { ascending: false }).limit(5000);
        if (since) query = query.gte("criado_em", since);
        const { data } = await query;
        const validData = filterValidLocationRecords(data);
        if (validData.length > 0) sheets.push({ name: "Visitantes", data: validData.map(mapVisitante) });
      }

      if (selectedType === "cliques" || selectedType === "todos") {
        let query = supabase.from("cliques_whatsapp").select("*").or("pais.eq.Brasil,pais.is.null").order("criado_em", { ascending: false }).limit(5000);
        if (since) query = query.gte("criado_em", since);
        const { data } = await query;
        const validData = filterValidLocationRecords(data);
        if (validData.length > 0) sheets.push({ name: "Cliques", data: validData.map(mapClique) });
      }

      exportXlsx(exportFilename(selectedType === "todos" ? "Completo" : selectedType.charAt(0).toUpperCase() + selectedType.slice(1)), sheets);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Exportar Dados</h1>
        <p className="text-sm text-muted-foreground">Exporte dados reais do Supabase em formato Excel — todos os campos capturados, padronizados e organizados</p>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Período</h3>
        </div>
        <div className="flex gap-2">
          {[{ label: "7 dias", value: "7" }, { label: "30 dias", value: "30" }, { label: "90 dias", value: "90" }, { label: "Tudo", value: "all" }].map((p) => (
            <button key={p.value} onClick={() => setDateRange(p.value)}
              className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors ${dateRange === p.value ? "bg-primary text-primary-foreground" : "bg-white/[0.04] text-muted-foreground hover:text-foreground"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {dataTypes.map((dt) => (
          <motion.button key={dt.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedType(dt.id)}
            className={`glass-card-hover p-5 text-left transition-all ${selectedType === dt.id ? "ring-2 ring-primary" : ""}`}>
            <FileSpreadsheet className={`h-6 w-6 mb-2 ${selectedType === dt.id ? "text-primary" : "text-muted-foreground"}`} />
            <h4 className="text-sm font-medium text-foreground">{dt.label}</h4>
            <p className="mt-1 text-xs text-muted-foreground">{dt.description}</p>
          </motion.button>
        ))}
      </div>

      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={handleExport} disabled={exporting}
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary py-4 text-lg font-medium text-primary-foreground hover:bg-primary/90 transition-colors rose-glow disabled:opacity-50">
        {exporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
        {exporting ? "Exportando..." : "Exportar para Excel"}
      </motion.button>

      <div className="glass-card p-4">
        <h4 className="text-xs font-medium text-foreground mb-2">Campos incluídos em cada exportação:</h4>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3 text-[10px] text-muted-foreground">
          <div>
            <span className="font-medium text-foreground/80">Formulários:</span> Nome, Telefone, Email, Mensagem, Cidade, Estado, Bairro, CEP, Rua, Endereço, Zona Eleitoral, Região, País, Coordenadas, IP, Data/Hora, Lida
          </div>
          <div>
            <span className="font-medium text-foreground/80">Visitantes:</span> Cookie, Página, Cidade, Estado, Bairro, CEP, Rua, Endereço, Zona Eleitoral, Região, País, Coordenadas, Dispositivo, Navegador, SO, Tela, Referrer, UTMs, Nº Visitas, IP, Data/Hora
          </div>
          <div>
            <span className="font-medium text-foreground/80">Cliques:</span> Tipo, Botão, Seção, Página Origem, URL Destino, Cookie, Cidade, Estado, Bairro, CEP, Rua, Endereço, Zona Eleitoral, Região, País, Coordenadas, Dispositivo, SO, IP, Data/Hora
          </div>
        </div>
      </div>
    </div>
  );
}
