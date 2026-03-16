import { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileSpreadsheet, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";

const dataTypes = [
  { id: "formularios", label: "Formulários", description: "Todas as submissões com dados completos" },
  { id: "visitantes", label: "Visitantes", description: "Acessos ao site com dispositivo e origem" },
  { id: "cliques", label: "Cliques", description: "Cliques em WhatsApp, Instagram e Facebook" },
  { id: "todos", label: "Tudo Combinado", description: "Exportação completa de todos os dados" },
];

export default function Exportar() {
  const [selectedType, setSelectedType] = useState("formularios");
  const [dateRange, setDateRange] = useState("30");
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      const since = dateRange === "all" ? undefined : new Date(Date.now() - parseInt(dateRange) * 86400000).toISOString();

      if (selectedType === "formularios" || selectedType === "todos") {
        let query = supabase.from("mensagens_contato").select("*").order("criado_em", { ascending: false }).limit(1000);
        if (since) query = query.gte("criado_em", since);
        const { data } = await query;
        if (data) {
          const ws = XLSX.utils.json_to_sheet(data.map((f) => ({
            Nome: f.nome, Telefone: f.telefone, Email: f.email || "", Mensagem: f.mensagem,
            Cidade: f.cidade || "", Estado: f.estado || "", País: f.pais || "",
            Lat: f.latitude, Lng: f.longitude, IP: f.endereco_ip || "",
            Data: format(new Date(f.criado_em), "dd/MM/yyyy HH:mm"), Lida: f.lida ? "Sim" : "Não",
          })));
          XLSX.utils.book_append_sheet(wb, ws, "Formulários");
        }
      }

      if (selectedType === "visitantes" || selectedType === "todos") {
        let query = supabase.from("acessos_site").select("*").order("criado_em", { ascending: false }).limit(1000);
        if (since) query = query.gte("criado_em", since);
        const { data } = await query;
        if (data) {
          const ws = XLSX.utils.json_to_sheet(data.map((v) => ({
            Cookie: v.cookie_visitante || "", Cidade: v.cidade || "", Estado: v.estado || "",
            Dispositivo: v.dispositivo || "", Navegador: v.navegador || "", SO: v.sistema_operacional || "",
            Página: v.pagina, Referrer: v.referrer || "", UTM_Source: v.utm_source || "",
            UTM_Medium: v.utm_medium || "", UTM_Campaign: v.utm_campaign || "",
            Visitas: v.contador_visitas, "Primeira Visita": v.primeira_visita ? "Sim" : "Não",
            Data: format(new Date(v.criado_em), "dd/MM/yyyy HH:mm"),
          })));
          XLSX.utils.book_append_sheet(wb, ws, "Visitantes");
        }
      }

      if (selectedType === "cliques" || selectedType === "todos") {
        let query = supabase.from("cliques_whatsapp").select("*").order("criado_em", { ascending: false }).limit(1000);
        if (since) query = query.gte("criado_em", since);
        const { data } = await query;
        if (data) {
          const ws = XLSX.utils.json_to_sheet(data.map((c) => ({
            Tipo: c.tipo_clique || "whatsapp", Botão: c.texto_botao || "", Seção: c.secao_pagina || "",
            Cidade: c.cidade || "", Estado: c.estado || "", Lat: c.latitude, Lng: c.longitude,
            Data: format(new Date(c.criado_em), "dd/MM/yyyy HH:mm"),
          })));
          XLSX.utils.book_append_sheet(wb, ws, "Cliques");
        }
      }

      XLSX.writeFile(wb, `chama-rosa-${selectedType}-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Exportar Dados</h1>
        <p className="text-sm text-muted-foreground">Exporte dados reais do Supabase em formato Excel</p>
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

      <p className="text-center text-xs text-muted-foreground">
        Dados reais do Supabase. A exportação inclui todos os campos capturados pelo Site Principal.
      </p>
    </div>
  );
}
