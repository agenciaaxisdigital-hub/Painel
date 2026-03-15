import { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileSpreadsheet, Calendar } from "lucide-react";
import { format, subDays } from "date-fns";
import * as XLSX from "xlsx";
import { generateFormSubmissions, generateVisitors, generateClickData } from "@/lib/mock-data";

const dataTypes = [
  { id: "formularios", label: "Formulários", description: "Todas as submissões com dados completos" },
  { id: "visitantes", label: "Visitantes", description: "Perfis de visitantes com histórico" },
  { id: "cliques", label: "Cliques", description: "Cliques em WhatsApp e Instagram" },
  { id: "todos", label: "Tudo Combinado", description: "Exportação completa de todos os dados" },
];

export default function Exportar() {
  const [selectedType, setSelectedType] = useState("formularios");
  const [dateRange, setDateRange] = useState("30");

  const handleExport = () => {
    const wb = XLSX.utils.book_new();

    if (selectedType === "formularios" || selectedType === "todos") {
      const forms = generateFormSubmissions(50);
      const ws = XLSX.utils.json_to_sheet(forms.map(s => ({
        Nome: s.nome, Telefone: s.telefone, Email: s.email, Mensagem: s.mensagem,
        Cidade: s.cidade, Bairro: s.bairro, Zona: s.zonaEleitoral,
        Lat: s.latitude.toFixed(6), Lng: s.longitude.toFixed(6),
        Dispositivo: s.dispositivo, Navegador: s.navegador, SO: s.sistemaOperacional,
        IP: s.enderecoIP, Data: format(s.criadoEm, "dd/MM/yyyy HH:mm"), "Tempo(s)": s.tempoPreenchimento,
      })));
      XLSX.utils.book_append_sheet(wb, ws, "Formulários");
    }

    if (selectedType === "visitantes" || selectedType === "todos") {
      const visitors = generateVisitors(100);
      const ws = XLSX.utils.json_to_sheet(visitors.map(v => ({
        ID: v.cookieId, Cidade: v.cidade, Estado: v.estado, Zona: v.zonaEleitoral || "",
        Bairro: v.bairro || "", Dispositivo: v.dispositivo, Navegador: v.navegador, SO: v.sistemaOperacional,
        Visitas: v.totalVisitas, "Tempo Total(s)": v.tempoTotal,
        "Primeira Visita": format(v.primeiraVisita, "dd/MM/yyyy"), "Última Visita": format(v.ultimaVisita, "dd/MM/yyyy"),
        Ações: v.acoes.join(", "),
      })));
      XLSX.utils.book_append_sheet(wb, ws, "Visitantes");
    }

    if (selectedType === "cliques" || selectedType === "todos") {
      const clicks = generateClickData(80);
      const ws = XLSX.utils.json_to_sheet(clicks.map(c => ({
        Tipo: c.tipo, Cidade: c.cidade, Estado: c.estado, Zona: c.zonaEleitoral,
        Dispositivo: c.dispositivo, Data: format(c.criadoEm, "dd/MM/yyyy HH:mm"),
      })));
      XLSX.utils.book_append_sheet(wb, ws, "Cliques");
    }

    XLSX.writeFile(wb, `chama-rosa-export-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Exportar Dados</h1>
        <p className="text-sm text-muted-foreground">Exporte dados completos da campanha em formato Excel</p>
      </div>

      {/* Date Range */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Período</h3>
        </div>
        <div className="flex gap-2">
          {[{ label: "7 dias", value: "7" }, { label: "30 dias", value: "30" }, { label: "90 dias", value: "90" }, { label: "Tudo", value: "all" }].map(p => (
            <button key={p.value} onClick={() => setDateRange(p.value)} className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors ${dateRange === p.value ? "bg-primary text-primary-foreground" : "bg-white/[0.04] text-muted-foreground hover:text-foreground"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data Type Selection */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {dataTypes.map(dt => (
          <motion.button
            key={dt.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedType(dt.id)}
            className={`glass-card-hover p-5 text-left transition-all ${selectedType === dt.id ? "ring-2 ring-primary" : ""}`}
          >
            <FileSpreadsheet className={`h-6 w-6 mb-2 ${selectedType === dt.id ? "text-primary" : "text-muted-foreground"}`} />
            <h4 className="text-sm font-medium text-foreground">{dt.label}</h4>
            <p className="mt-1 text-xs text-muted-foreground">{dt.description}</p>
          </motion.button>
        ))}
      </div>

      {/* Export Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleExport}
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-primary py-4 text-lg font-medium text-primary-foreground hover:bg-primary/90 transition-colors rose-glow"
      >
        <Download className="h-5 w-5" />
        Exportar para Excel
      </motion.button>

      <p className="text-center text-xs text-muted-foreground">
        A exportação inclui todos os campos capturados: localização, zona eleitoral identificada, dispositivo, IP, e todos os dados silenciosamente coletados.
      </p>
    </div>
  );
}
