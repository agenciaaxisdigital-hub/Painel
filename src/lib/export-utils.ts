import { format, parseISO } from "date-fns";
import * as XLSX from "xlsx";

// ══════════════════════════════════════════════════════════════
// CENTRAL EXPORT UTILITY — Painel Dashboard
// All column names are standardized here. Any export in the app
// MUST use these mappers to guarantee consistency.
// ══════════════════════════════════════════════════════════════

const fmt = (d: string) => {
  try { return format(parseISO(d), "dd/MM/yyyy HH:mm:ss"); } catch { return d; }
};
const fmtShort = (d: string) => {
  try { return format(parseISO(d), "dd/MM/yyyy HH:mm"); } catch { return d; }
};
const s = (v: any) => v || "";
const n = (v: any) => v ?? "";

// ─── FORMULÁRIOS ───
export function mapFormulario(f: any) {
  return {
    "Nome": s(f.nome),
    "Telefone": s(f.telefone),
    "Email": s(f.email),
    "Mensagem": s(f.mensagem),
    "Cidade": s(f.cidade),
    "Estado": s(f.estado),
    "Bairro": s(f.bairro),
    "CEP": s(f.cep),
    "Rua": s(f.rua),
    "Endereço Completo": s(f.endereco_completo),
    "Zona Eleitoral": s(f.zona_eleitoral),
    "Região Planejamento": s(f.regiao_planejamento),
    "País": s(f.pais),
    "Latitude": n(f.latitude),
    "Longitude": n(f.longitude),
    "Precisão Localização": s(f.precisao_localizacao),
    "IP": s(f.endereco_ip),
    "User Agent": s(f.user_agent),
    "Data/Hora": fmt(f.criado_em),
    "Lida": f.lida ? "Sim" : "Não",
  };
}

// ─── VISITANTES ───
export function mapVisitante(v: any) {
  return {
    "Cookie Visitante": s(v.cookie_visitante),
    "Página": s(v.pagina),
    "Cidade": s(v.cidade),
    "Estado": s(v.estado),
    "Bairro": s(v.bairro),
    "CEP": s(v.cep),
    "Rua": s(v.rua),
    "Endereço Completo": s(v.endereco_completo),
    "Zona Eleitoral": s(v.zona_eleitoral),
    "Região Planejamento": s(v.regiao_planejamento),
    "País": s(v.pais),
    "Latitude": n(v.latitude),
    "Longitude": n(v.longitude),
    "Precisão Localização": s(v.precisao_localizacao),
    "Dispositivo": s(v.dispositivo),
    "Navegador": s(v.navegador),
    "Sistema Operacional": s(v.sistema_operacional),
    "Largura Tela": n(v.largura_tela),
    "Altura Tela": n(v.altura_tela),
    "Referrer": s(v.referrer),
    "UTM Source": s(v.utm_source),
    "UTM Medium": s(v.utm_medium),
    "UTM Campaign": s(v.utm_campaign),
    "UTM Content": s(v.utm_content),
    "UTM Term": s(v.utm_term),
    "Nº Visitas": n(v.contador_visitas),
    "Primeira Visita": v.primeira_visita ? "Sim" : "Não",
    "IP": s(v.endereco_ip),
    "User Agent": s(v.user_agent),
    "Data/Hora": fmt(v.criado_em),
  };
}

// ─── CLIQUES (WhatsApp / Instagram / Facebook) ───
export function mapClique(c: any) {
  return {
    "Tipo Clique": s(c.tipo_clique) || "whatsapp",
    "Texto Botão": s(c.texto_botao),
    "Seção Página": s(c.secao_pagina),
    "Página Origem": s(c.pagina_origem),
    "URL Destino": s(c.url_destino),
    "Telefone Destino": s(c.telefone_destino),
    "Cookie Visitante": s(c.cookie_visitante),
    "Cidade": s(c.cidade),
    "Estado": s(c.estado),
    "Bairro": s(c.bairro),
    "CEP": s(c.cep),
    "Rua": s(c.rua),
    "Endereço Completo": s(c.endereco_completo),
    "Zona Eleitoral": s(c.zona_eleitoral),
    "Região Planejamento": s(c.regiao_planejamento),
    "País": s(c.pais),
    "Latitude": n(c.latitude),
    "Longitude": n(c.longitude),
    "Precisão Localização": s(c.precisao_localizacao),
    "Dispositivo": s(c.dispositivo),
    "Navegador": s(c.navegador),
    "Sistema Operacional": s(c.sistema_operacional),
    "IP": s(c.endereco_ip),
    "User Agent": s(c.user_agent),
    "Data/Hora": fmt(c.criado_em),
  };
}

// ─── INTERAÇÕES (Todas) ───
export function mapInteracao(r: any) {
  return {
    "Tipo": s(r.tipo_label || r.tipo),
    "Data/Hora": fmt(r.data_hora || r.criado_em),
    "Nome": s(r.nome),
    "Telefone": s(r.telefone),
    "Email": s(r.email),
    "Mensagem": s(r.mensagem),
    "Cidade": s(r.cidade),
    "Estado": s(r.estado),
    "Bairro": s(r.bairro),
    "CEP": s(r.cep),
    "Rua": s(r.rua),
    "Endereço Completo": s(r.endereco_completo),
    "Zona Eleitoral": s(r.zona_eleitoral),
    "Região Planejamento": s(r.regiao_planejamento),
    "País": s(r.pais),
    "Latitude": n(r.latitude),
    "Longitude": n(r.longitude),
    "Precisão Localização": s(r.precisao_localizacao),
    "Dispositivo": s(r.dispositivo),
    "Sistema Operacional": s(r.sistema_operacional),
    "Navegador": s(r.navegador),
    "Página": s(r.pagina),
    "Texto Botão": s(r.texto_botao),
    "Seção Página": s(r.secao_pagina),
    "UTM Source": s(r.utm_source),
    "UTM Medium": s(r.utm_medium),
    "UTM Campaign": s(r.utm_campaign),
    "UTM Content": s(r.utm_content),
    "Referrer": s(r.referrer),
    "IP": s(r.endereco_ip),
    "Cookie Visitante": s(r.cookie_visitante),
  };
}

// ─── LEADS CSV (para WhatsApp em massa) ───
export function mapLeadCsv(r: any) {
  return {
    "Nome": s(r.nome),
    "Telefone": s(r.telefone),
    "Cidade": s(r.cidade),
    "Estado": s(r.estado),
    "Bairro": s(r.bairro),
    "Zona Eleitoral": s(r.zona_eleitoral),
    "Data/Hora": fmtShort(r.data_hora || r.criado_em),
  };
}

// ─── REGIÕES / ZONAS ───
export function mapRegiao(r: { nome: string; tipo: string; visitors: number; forms: number; whatsapp: number; instagram: number; facebook: number; total: number }) {
  return {
    "Região / Zona": s(r.nome),
    "Tipo": s(r.tipo),
    "Visitantes": r.visitors,
    "Formulários": r.forms,
    "Cliques WhatsApp": r.whatsapp,
    "Cliques Instagram": r.instagram,
    "Cliques Facebook": r.facebook,
    "Total Interações": r.total,
  };
}

// ─── MAPA GOIÁS (Regiões de Planejamento) ───
export function mapRegiaoGoias(r: { nome: string; visitantes: number; formularios: number; cliques: number }) {
  return {
    "Região de Planejamento": s(r.nome),
    "Visitantes": r.visitantes,
    "Formulários": r.formularios,
    "Cliques": r.cliques,
  };
}

// ══════════════════════════════════════════════════════════════
// EXPORT HELPERS
// ══════════════════════════════════════════════════════════════

/** Generate and download an XLSX file with one or more sheets */
export function exportXlsx(
  filename: string,
  sheets: { name: string; data: any[] }[]
) {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, data }) => {
    if (data.length > 0) {
      const ws = XLSX.utils.json_to_sheet(data);
      // Auto-fit column widths
      const colWidths = Object.keys(data[0]).map((key) => {
        const maxLen = Math.max(
          key.length,
          ...data.slice(0, 100).map((row) => String(row[key] ?? "").length)
        );
        return { wch: Math.min(maxLen + 2, 50) };
      });
      ws["!cols"] = colWidths;
      XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 31)); // Excel max 31 chars
    }
  });
  XLSX.writeFile(wb, filename);
}

/** Generate and download a CSV file */
export function exportCsv(filename: string, data: any[]) {
  if (data.length === 0) return;
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }); // BOM for Excel
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Standard filename generator */
export function exportFilename(prefix: string, ext: "xlsx" | "csv" = "xlsx") {
  return `ChamaRosa_${prefix}_${format(new Date(), "yyyy-MM-dd")}.${ext}`;
}
