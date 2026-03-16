import { useState, useMemo, useCallback } from "react";
import { formatPageName } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format, parseISO, getHours } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  Eye, Phone, Camera, Facebook, FileText, Search, Download, X, ChevronDown, ChevronRight,
  Smartphone, Monitor, Tablet, Copy, ExternalLink, Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/dashboard/AnimatedNumber";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { EMPTY_STATE_MESSAGE, PLATFORM_COLORS } from "@/lib/constants";
import { CompactLocation, FullLocationDetail } from "@/components/shared/LocationDisplay";
import { useHourlyHeatmap } from "@/hooks/use-supabase-data";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";

// ── Types ──
type InteractionType = "acesso" | "whatsapp" | "instagram" | "facebook" | "formulario";

interface UnifiedInteraction {
  id: string;
  tipo: InteractionType;
  data_hora: string;
  nome?: string | null;
  telefone?: string | null;
  email?: string | null;
  mensagem?: string | null;
  cidade?: string | null;
  estado?: string | null;
  bairro?: string | null;
  cep?: string | null;
  endereco_completo?: string | null;
  rua?: string | null;
  zona_eleitoral?: string | null;
  regiao_planejamento?: string | null;
  endereco_ip?: string | null;
  dispositivo?: string | null;
  sistema_operacional?: string | null;
  navegador?: string | null;
  pagina?: string | null;
  referrer?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  primeira_visita?: boolean | null;
  contador_visitas?: number | null;
  cookie_visitante?: string | null;
  texto_botao?: string | null;
  secao_pagina?: string | null;
  url_destino?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  lida?: boolean | null;
  user_agent?: string | null;
  largura_tela?: number | null;
  altura_tela?: number | null;
  pais?: string | null;
  source_table: "acessos_site" | "mensagens_contato" | "cliques_whatsapp";
}

const TIPO_CONFIG: Record<InteractionType, { label: string; color: string; bgColor: string; Icon: any }> = {
  acesso:     { label: "Acesso ao Site",       color: "text-blue-400",  bgColor: "bg-blue-500/10",  Icon: Eye },
  whatsapp:   { label: "Clique WhatsApp",      color: "text-success",   bgColor: "bg-success/10",   Icon: Phone },
  instagram:  { label: "Clique Instagram",     color: "text-primary",   bgColor: "bg-primary/10",   Icon: Camera },
  facebook:   { label: "Clique Facebook",      color: "text-blue-500",  bgColor: "bg-blue-600/10",  Icon: Facebook },
  formulario: { label: "Respondeu Formulário", color: "text-rose-400",  bgColor: "bg-rose-500/10",  Icon: FileText },
};

const PAGE_SIZE = 50;

function safeField(record: any, field: string): any {
  return record?.[field] ?? null;
}

function mapAcesso(r: any): UnifiedInteraction {
  return {
    id: r.id, tipo: "acesso", data_hora: r.criado_em, cidade: r.cidade, estado: r.estado,
    bairro: safeField(r, "bairro"), cep: safeField(r, "cep"), endereco_completo: safeField(r, "endereco_completo"),
    rua: safeField(r, "rua"), zona_eleitoral: safeField(r, "zona_eleitoral"), regiao_planejamento: safeField(r, "regiao_planejamento"),
    endereco_ip: r.endereco_ip, dispositivo: r.dispositivo, sistema_operacional: r.sistema_operacional,
    navegador: r.navegador, pagina: r.pagina, referrer: r.referrer,
    utm_source: r.utm_source, utm_medium: r.utm_medium, utm_campaign: r.utm_campaign,
    utm_content: r.utm_content, utm_term: r.utm_term, primeira_visita: r.primeira_visita,
    contador_visitas: r.contador_visitas, cookie_visitante: r.cookie_visitante,
    user_agent: r.user_agent, largura_tela: r.largura_tela, altura_tela: r.altura_tela, pais: r.pais,
    latitude: safeField(r, "latitude"), longitude: safeField(r, "longitude"),
    source_table: "acessos_site",
  };
}

function mapFormulario(r: any): UnifiedInteraction {
  return {
    id: r.id, tipo: "formulario", data_hora: r.criado_em, nome: r.nome, telefone: r.telefone,
    email: r.email, mensagem: r.mensagem, cidade: r.cidade, estado: r.estado,
    bairro: safeField(r, "bairro"), cep: safeField(r, "cep"), endereco_completo: safeField(r, "endereco_completo"),
    rua: safeField(r, "rua"), zona_eleitoral: safeField(r, "zona_eleitoral"), regiao_planejamento: safeField(r, "regiao_planejamento"),
    endereco_ip: r.endereco_ip, latitude: r.latitude, longitude: r.longitude,
    user_agent: r.user_agent, lida: r.lida, pais: r.pais, source_table: "mensagens_contato",
  };
}

function mapClique(r: any): UnifiedInteraction {
  const tipo = (r.tipo_clique === "instagram" ? "instagram" : r.tipo_clique === "facebook" ? "facebook" : "whatsapp") as InteractionType;
  return {
    id: r.id, tipo, data_hora: r.criado_em, cidade: r.cidade, estado: r.estado,
    bairro: safeField(r, "bairro"), cep: safeField(r, "cep"), endereco_completo: safeField(r, "endereco_completo"),
    rua: safeField(r, "rua"), zona_eleitoral: safeField(r, "zona_eleitoral"), regiao_planejamento: safeField(r, "regiao_planejamento"),
    endereco_ip: r.endereco_ip, cookie_visitante: r.cookie_visitante,
    texto_botao: r.texto_botao, secao_pagina: r.secao_pagina, url_destino: r.url_destino,
    latitude: r.latitude, longitude: r.longitude, user_agent: r.user_agent, pais: r.pais,
    dispositivo: safeField(r, "dispositivo"), sistema_operacional: safeField(r, "sistema_operacional"),
    navegador: safeField(r, "navegador"),
    source_table: "cliques_whatsapp",
  };
}

// ── Hooks ──
function useInteractions(filters: { days: number; tipos: InteractionType[]; search: string; cidade: string; dispositivo: string[]; page: number }) {
  const { days, tipos, search, cidade, dispositivo, page } = filters;
  return useQuery({
    queryKey: ["todas-interacoes", days, tipos, search, cidade, dispositivo, page],
    queryFn: async () => {
      // Calculate date range
      let since: string;
      let until: string | undefined;
      const now = new Date();

      if (days === -1) {
        // "Ontem" — only yesterday
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(todayStart.getDate() - 1);
        since = yesterdayStart.toISOString();
        until = todayStart.toISOString();
      } else {
        since = subDays(now, days).toISOString();
      }

      const results: UnifiedInteraction[] = [];
      const counts = { acesso: 0, whatsapp: 0, instagram: 0, facebook: 0, formulario: 0 };
      const queries: Promise<void>[] = [];

      // Build count queries with date range
      const addDateFilter = (q: any) => {
        q = q.gte("criado_em", since);
        if (until) q = q.lt("criado_em", until);
        return q;
      };

      const countPromise = Promise.all([
        addDateFilter(supabase.from("acessos_site").select("*", { count: "exact", head: true }).or("pais.eq.Brasil,pais.is.null")),
        addDateFilter(supabase.from("mensagens_contato").select("*", { count: "exact", head: true }).or("pais.eq.Brasil,pais.is.null")),
        addDateFilter(supabase.from("cliques_whatsapp").select("*", { count: "exact", head: true }).eq("tipo_clique", "whatsapp").or("pais.eq.Brasil,pais.is.null")),
        addDateFilter(supabase.from("cliques_whatsapp").select("*", { count: "exact", head: true }).eq("tipo_clique", "instagram").or("pais.eq.Brasil,pais.is.null")),
        addDateFilter(supabase.from("cliques_whatsapp").select("*", { count: "exact", head: true }).eq("tipo_clique", "facebook").or("pais.eq.Brasil,pais.is.null")),
      ]).then(([a, f, w, i, fb]) => {
        counts.acesso = a.count ?? 0; counts.formulario = f.count ?? 0;
        counts.whatsapp = w.count ?? 0; counts.instagram = i.count ?? 0; counts.facebook = fb.count ?? 0;
      });

      if (tipos.includes("acesso")) {
        queries.push((async () => {
          let q = supabase.from("acessos_site").select("*").gte("criado_em", since).or("pais.eq.Brasil,pais.is.null").order("criado_em", { ascending: false });
          if (until) q = q.lt("criado_em", until);
          if (search) q = q.or(`cidade.ilike.%${search}%,endereco_ip.ilike.%${search}%,utm_campaign.ilike.%${search}%`);
          if (cidade) q = q.eq("cidade", cidade);
          if (dispositivo.length > 0) q = q.in("dispositivo", dispositivo.map((d) => d.toLowerCase()));
          const { data } = await q.limit(500);
          (data || []).forEach((r) => results.push(mapAcesso(r)));
        })());
      }

      if (tipos.includes("formulario")) {
        queries.push((async () => {
          let q = supabase.from("mensagens_contato").select("*").gte("criado_em", since).or("pais.eq.Brasil,pais.is.null").order("criado_em", { ascending: false });
          if (until) q = q.lt("criado_em", until);
          if (search) q = q.or(`nome.ilike.%${search}%,telefone.ilike.%${search}%,cidade.ilike.%${search}%,email.ilike.%${search}%`);
          if (cidade) q = q.eq("cidade", cidade);
          const { data } = await q.limit(500);
          (data || []).forEach((r) => results.push(mapFormulario(r)));
        })());
      }

      if (tipos.some((t) => ["whatsapp", "instagram", "facebook"].includes(t))) {
        const clickTypes = tipos.filter((t) => ["whatsapp", "instagram", "facebook"].includes(t));
        queries.push((async () => {
          let q = supabase.from("cliques_whatsapp").select("*").gte("criado_em", since).or("pais.eq.Brasil,pais.is.null").order("criado_em", { ascending: false });
          if (until) q = q.lt("criado_em", until);
          if (clickTypes.length > 0 && clickTypes.length < 3) q = q.in("tipo_clique", clickTypes);
          if (search) q = q.or(`cidade.ilike.%${search}%,texto_botao.ilike.%${search}%,endereco_ip.ilike.%${search}%`);
          if (cidade) q = q.eq("cidade", cidade);
          const { data } = await q.limit(500);
          (data || []).forEach((r) => results.push(mapClique(r)));
        })());
      }

      await Promise.all([countPromise, ...queries]);
      results.sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime());
      const total = results.length;
      return { interactions: results.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), total, counts, allResults: results };
    },
    staleTime: 30_000,
  });
}

function useCities(days: number) {
  return useQuery({
    queryKey: ["interaction-cities", days],
    queryFn: async () => {
      const now = new Date();
      let since: string;
      if (days === -1) {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(todayStart.getDate() - 1);
        since = yesterdayStart.toISOString();
      } else {
        since = subDays(now, days).toISOString();
      }
      const { data } = await supabase.from("acessos_site").select("cidade").gte("criado_em", since).or("pais.eq.Brasil,pais.is.null").limit(1000);
      const set = new Set<string>();
      (data || []).forEach((r) => { if (r.cidade) set.add(r.cidade); });
      return Array.from(set).sort();
    },
    staleTime: 120_000,
  });
}

function useLastHourCount() {
  return useQuery({
    queryKey: ["last-hour-count"],
    queryFn: async () => {
      const since = subDays(new Date(), 1 / 24).toISOString();
      const [a, c, f] = await Promise.all([
        supabase.from("acessos_site").select("*", { count: "exact", head: true }).gte("criado_em", since).or("pais.eq.Brasil,pais.is.null"),
        supabase.from("cliques_whatsapp").select("*", { count: "exact", head: true }).gte("criado_em", since).or("pais.eq.Brasil,pais.is.null"),
        supabase.from("mensagens_contato").select("*", { count: "exact", head: true }).gte("criado_em", since).or("pais.eq.Brasil,pais.is.null"),
      ]);
      return (a.count ?? 0) + (c.count ?? 0) + (f.count ?? 0);
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

function maskIp(ip: string | null | undefined): string {
  if (!ip) return "—";
  const parts = ip.split(".");
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.XXX.XXX`;
  return ip;
}

function DeviceIcon({ device }: { device?: string | null }) {
  const d = (device || "").toLowerCase();
  if (d.includes("mobile") || d.includes("celular")) return <Smartphone className="h-3.5 w-3.5" />;
  if (d.includes("tablet")) return <Tablet className="h-3.5 w-3.5" />;
  return <Monitor className="h-3.5 w-3.5" />;
}

// ── Main Component ──
export default function Interacoes() {
  const { toast } = useToast();
  const [days, setDays] = useState(7);
  const [tipos, setTipos] = useState<InteractionType[]>(["acesso", "whatsapp", "instagram", "facebook", "formulario"]);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [cidade, setCidade] = useState("");
  const [dispositivo, setDispositivo] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [heatmapPlatform, setHeatmapPlatform] = useState<string | undefined>(undefined);

  const handleSearch = useCallback((val: string) => {
    setSearchInput(val);
    const timeout = setTimeout(() => { setSearch(val); setPage(0); }, 400);
    return () => clearTimeout(timeout);
  }, []);

  const { data, isLoading } = useInteractions({ days, tipos, search, cidade, dispositivo, page });
  const cities = useCities(days);
  const lastHour = useLastHourCount();
  const heatmap = useHourlyHeatmap(days, heatmapPlatform);

  const interactions = data?.interactions || [];
  const total = data?.total || 0;
  const counts = data?.counts || { acesso: 0, whatsapp: 0, instagram: 0, facebook: 0, formulario: 0 };
  const allResults = data?.allResults || [];
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const activeFilterCount = (tipos.length < 5 ? 1 : 0) + (cidade ? 1 : 0) + (dispositivo.length > 0 ? 1 : 0) + (search ? 1 : 0);

  // Derived analytics from clicks
  const clickResults = allResults.filter((r) => ["whatsapp", "instagram", "facebook"].includes(r.tipo));

  const peakHour = useMemo(() => {
    const hours: Record<number, number> = {};
    allResults.forEach((r) => { const h = getHours(parseISO(r.data_hora)); hours[h] = (hours[h] || 0) + 1; });
    const sorted = Object.entries(hours).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? `${sorted[0][0]}h` : "—";
  }, [allResults]);

  const sectionData = useMemo(() => {
    const sectionCounts: Record<string, { total: number; whatsapp: number; instagram: number; facebook: number }> = {};
    clickResults.forEach((r) => {
      const sec = r.secao_pagina || "Sem seção";
      if (!sectionCounts[sec]) sectionCounts[sec] = { total: 0, whatsapp: 0, instagram: 0, facebook: 0 };
      sectionCounts[sec].total++;
      if (r.tipo in sectionCounts[sec]) (sectionCounts[sec] as any)[r.tipo]++;
    });
    return Object.entries(sectionCounts).sort((a, b) => b[1].total - a[1].total).map(([name, vals]) => ({ name, ...vals }));
  }, [clickResults]);

  const heatmapMax = useMemo(() => Math.max(1, ...(heatmap.data || []).map((h) => h.valor)), [heatmap.data]);

  const clearFilters = () => {
    setTipos(["acesso", "whatsapp", "instagram", "facebook", "formulario"]);
    setSearch(""); setSearchInput(""); setCidade(""); setDispositivo([]); setPage(0);
  };

  const toggleTipo = (t: InteractionType) => {
    setTipos((prev) => { const next = prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]; return next.length === 0 ? [t] : next; });
    setPage(0);
  };

  const filterOnlyTipo = (t: InteractionType) => { setTipos([t]); setPage(0); };

  const handleExportXlsx = () => {
    const rows = allResults.map((r) => ({
      Tipo: TIPO_CONFIG[r.tipo].label, "Data/Hora": format(parseISO(r.data_hora), "dd/MM/yyyy HH:mm:ss"),
      Nome: r.nome || "", Telefone: r.telefone || "", Email: r.email || "",
      Cidade: r.cidade || "", Estado: r.estado || "", Bairro: r.bairro || "",
      CEP: r.cep || "", "Endereço Completo": r.endereco_completo || "",
      "Zona Eleitoral": r.zona_eleitoral || "", IP: r.endereco_ip || "",
      Dispositivo: r.dispositivo || "", SO: r.sistema_operacional || "", Navegador: r.navegador || "",
      Página: r.pagina || "", "Texto Botão": r.texto_botao || "", "Seção Página": r.secao_pagina || "",
      UTM_Source: r.utm_source || "", UTM_Medium: r.utm_medium || "", UTM_Campaign: r.utm_campaign || "",
      Referrer: r.referrer || "", Latitude: r.latitude || "", Longitude: r.longitude || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Interações");
    XLSX.writeFile(wb, `Interacoes_ChamaRosa_${format(new Date(), "ddMMyyyy")}.xlsx`);
    toast({ title: `${rows.length} registros exportados` });
  };

  const handleExportCsv = () => {
    const leads = allResults.filter((r) => r.tipo === "formulario" && r.telefone);
    if (leads.length === 0) { toast({ title: "Nenhum lead com telefone encontrado", variant: "destructive" }); return; }
    const rows = leads.map((r) => ({
      Nome: r.nome || "", Telefone: r.telefone || "", Cidade: r.cidade || "",
      Estado: r.estado || "", Bairro: r.bairro || "", "Zona Eleitoral": r.zona_eleitoral || "",
      "Data/Hora": format(parseISO(r.data_hora), "dd/MM/yyyy HH:mm"),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `Leads_ChamaRosa_${format(new Date(), "ddMMyyyy")}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast({ title: `${leads.length} leads exportados` });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Interações</h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span>Exibindo <strong className="text-foreground">{total.toLocaleString("pt-BR")}</strong> interações</span>
            {(lastHour.data ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-[10px] font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> {lastHour.data} na última hora
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportXlsx} className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Download className="h-3 w-3" /> Exportar XLSX
          </button>
          <button onClick={handleExportCsv} className="flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs text-primary hover:bg-primary/20 transition-colors">
            <Download className="h-3 w-3" /> Leads CSV
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {(["acesso", "whatsapp", "instagram", "facebook", "formulario"] as InteractionType[]).map((t) => {
          const cfg = TIPO_CONFIG[t];
          const active = tipos.length === 1 && tipos[0] === t;
          return (
            <motion.button key={t} onClick={() => filterOnlyTipo(t)} whileTap={{ scale: 0.97 }}
              className={`glass-card p-3 text-left transition-all ${active ? "ring-1 ring-primary/40" : "hover:bg-white/[0.04]"}`}>
              <div className="flex items-center gap-2">
                <div className={`rounded-lg p-1.5 ${cfg.bgColor}`}><cfg.Icon className={`h-3.5 w-3.5 ${cfg.color}`} /></div>
                <span className="text-[10px] text-muted-foreground">{cfg.label}</span>
              </div>
              <div className="mt-1 text-lg font-bold"><AnimatedNumber value={counts[t]} /></div>
            </motion.button>
          );
        })}
      </div>

      {/* Analytics Row: Section Breakdown + Heatmap */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Section Breakdown */}

        {/* Hourly Heatmap */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Mapa de Calor por Hora</h3>
            <div className="flex gap-1">
              {[{ label: "Todos", value: undefined }, { label: "WhatsApp", value: "whatsapp" }, { label: "Instagram", value: "instagram" }, { label: "Facebook", value: "facebook" }].map((opt) => (
                <button key={opt.label} onClick={() => setHeatmapPlatform(opt.value)}
                  className={`rounded-lg px-3 py-1 text-[10px] font-medium transition-colors ${heatmapPlatform === opt.value ? "bg-primary text-primary-foreground" : "bg-white/[0.04] text-muted-foreground hover:text-foreground"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {heatmap.isLoading ? <Skeleton className="h-[200px]" /> : heatmap.data ? (
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="flex gap-0.5 mb-1 pl-10">
                  {Array.from({ length: 24 }, (_, h) => (
                    <div key={h} className="flex-1 text-center text-[8px] text-muted-foreground">{h}</div>
                  ))}
                </div>
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
                  <div key={dia} className="flex gap-0.5 mb-0.5">
                    <div className="w-10 text-right pr-2 text-[9px] text-muted-foreground leading-[18px]">{dia}</div>
                    {Array.from({ length: 24 }, (_, h) => {
                      const cell = heatmap.data!.find((c) => c.dia === dia && c.hora === h);
                      const intensity = cell ? cell.valor / heatmapMax : 0;
                      return (
                        <div key={h} className="flex-1 h-[18px] rounded-sm transition-colors" title={`${dia} ${h}h: ${cell?.valor || 0} cliques`}
                          style={{ backgroundColor: intensity > 0 ? `hsl(45, 93%, ${85 - intensity * 60}%)` : "hsl(240, 5%, 10%)", opacity: intensity > 0 ? 0.4 + intensity * 0.6 : 0.3 }} />
                      );
                    })}
                  </div>
                ))}
                <div className="flex items-center gap-2 mt-3 text-[9px] text-muted-foreground">
                  <span>Menos</span>
                  {[0.1, 0.3, 0.5, 0.7, 1].map((i) => (
                    <div key={i} className="h-3 w-6 rounded-sm" style={{ backgroundColor: `hsl(45, 93%, ${85 - i * 60}%)`, opacity: 0.4 + i * 0.6 }} />
                  ))}
                  <span>Mais</span>
                </div>
              </div>
            </div>
          ) : <EmptyState description="Sem dados para gerar o mapa de calor." />}
        </motion.div>
      </div>

      {/* Extra metrics row */}
      {clickResults.length > 0 && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <div className="glass-card p-3">
            <span className="text-[10px] text-muted-foreground">Horário de Pico</span>
            <div className="text-lg font-bold">{peakHour}</div>
          </div>
          <div className="glass-card p-3">
            <span className="text-[10px] text-muted-foreground">Plataforma Líder</span>
            <div className="text-lg font-bold capitalize">
              {counts.whatsapp >= counts.instagram && counts.whatsapp >= counts.facebook ? "WhatsApp" :
               counts.instagram >= counts.facebook ? "Instagram" : "Facebook"}
            </div>
          </div>
          <div className="glass-card p-3">
            <span className="text-[10px] text-muted-foreground">Total Cliques</span>
            <div className="text-lg font-bold"><AnimatedNumber value={counts.whatsapp + counts.instagram + counts.facebook} /></div>
          </div>
          <div className="glass-card p-3">
            <span className="text-[10px] text-muted-foreground">Taxa Clique/Acesso</span>
            <div className="text-lg font-bold">
              {counts.acesso > 0 ? (((counts.whatsapp + counts.instagram + counts.facebook) / counts.acesso) * 100).toFixed(1) : "0"}%
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="glass-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            {[{ label: "Hoje", d: 1 }, { label: "Ontem", d: -1 }, { label: "7 dias", d: 7 }, { label: "30 dias", d: 30 }].map((p) => (
              <button key={p.d} onClick={() => { setDays(p.d); setPage(0); }}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors ${days === p.d ? "bg-primary text-primary-foreground" : "bg-white/[0.04] text-muted-foreground hover:text-foreground"}`}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="h-5 w-px bg-border" />
          <div className="flex gap-1">
            {(["acesso", "whatsapp", "instagram", "facebook", "formulario"] as InteractionType[]).map((t) => {
              const cfg = TIPO_CONFIG[t]; const active = tipos.includes(t);
              return (
                <button key={t} onClick={() => toggleTipo(t)}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors ${active ? `${cfg.bgColor} ${cfg.color}` : "bg-white/[0.02] text-muted-foreground/50"}`}>
                  <cfg.Icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{t === "acesso" ? "Acessos" : t === "formulario" ? "Forms" : t.charAt(0).toUpperCase() + t.slice(1)}</span>
                </button>
              );
            })}
          </div>
          <div className="h-5 w-px bg-border" />
          <select value={cidade} onChange={(e) => { setCidade(e.target.value); setPage(0); }}
            className="rounded-lg bg-white/[0.04] border border-border px-2 py-1.5 text-[11px] text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 max-w-[140px]">
            <option value="">Todas as cidades</option>
            {(cities.data || []).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex gap-1">
            {["Mobile", "Desktop", "Tablet"].map((d) => {
              const active = dispositivo.includes(d);
              return (
                <button key={d} onClick={() => { setDispositivo((prev) => active ? prev.filter((x) => x !== d) : [...prev, d]); setPage(0); }}
                  className={`rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors ${active ? "bg-primary/10 text-primary" : "bg-white/[0.02] text-muted-foreground/50 hover:text-muted-foreground"}`}>
                  {d === "Mobile" ? <Smartphone className="h-3 w-3" /> : d === "Desktop" ? <Monitor className="h-3 w-3" /> : <Tablet className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Buscar nome, telefone, cidade, IP, UTM..." value={searchInput}
              onChange={(e) => handleSearch(e.target.value)} className="h-8 pl-8 bg-white/[0.03] border-white/[0.08] text-xs" />
          </div>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-[10px] font-medium text-primary hover:bg-primary/20 transition-colors">
              <Filter className="h-3 w-3" /> {activeFilterCount} filtro{activeFilterCount > 1 ? "s" : ""} <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-2">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
        ) : interactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Eye className="h-10 w-10 text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">
              {total === 0 && !search && !cidade ? EMPTY_STATE_MESSAGE : "Nenhuma interação encontrada para os filtros selecionados."}
            </p>
            {(search || cidade || tipos.length < 5) && (
              <button onClick={clearFilters} className="mt-3 rounded-lg bg-primary/10 px-4 py-2 text-xs text-primary hover:bg-primary/20 transition-colors">Limpar filtros</button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10 bg-card border-b border-border">
                  <tr className="text-muted-foreground">
                    <th className="px-3 py-3 text-left font-medium w-8"></th>
                    <th className="px-3 py-3 text-left font-medium">Tipo</th>
                    <th className="px-3 py-3 text-left font-medium">Data e Hora</th>
                    <th className="px-3 py-3 text-left font-medium">Identificação</th>
                    <th className="px-3 py-3 text-left font-medium">Localização</th>
                    <th className="px-3 py-3 text-left font-medium">Dispositivo</th>
                    <th className="px-3 py-3 text-left font-medium">IP</th>
                    <th className="px-3 py-3 text-left font-medium">Origem</th>
                    <th className="px-3 py-3 text-left font-medium w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {interactions.map((row) => (
                    <InteractionRow key={`${row.source_table}-${row.id}`} row={row}
                      expanded={expandedId === `${row.source_table}-${row.id}`}
                      onToggle={() => setExpandedId(expandedId === `${row.source_table}-${row.id}` ? null : `${row.source_table}-${row.id}`)}
                      toast={toast} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="text-[11px] text-muted-foreground">Página {page + 1} de {totalPages} · {total} registros</span>
              <div className="flex gap-1">
                <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                  className="rounded-lg px-3 py-1.5 text-[11px] font-medium bg-white/[0.04] text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">Anterior</button>
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  const p = page < 3 ? i : page + i - 2;
                  if (p < 0 || p >= totalPages) return null;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors ${p === page ? "bg-primary text-primary-foreground" : "bg-white/[0.04] text-muted-foreground hover:text-foreground"}`}>
                      {p + 1}
                    </button>
                  );
                })}
                <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
                  className="rounded-lg px-3 py-1.5 text-[11px] font-medium bg-white/[0.04] text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">Próxima</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Row ──
function InteractionRow({ row, expanded, onToggle, toast }: { row: UnifiedInteraction; expanded: boolean; onToggle: () => void; toast: any }) {
  const cfg = TIPO_CONFIG[row.tipo];
  const origin = row.utm_source || (row.referrer?.includes("google") ? "Google" : row.referrer?.includes("instagram") ? "Instagram" : row.referrer?.includes("whatsapp") ? "WhatsApp" : row.referrer?.includes("facebook") ? "Facebook" : row.referrer ? "Outro" : "Direto");

  return (
    <>
      <tr onClick={onToggle} className="border-b border-border/30 hover:bg-white/[0.02] cursor-pointer transition-colors">
        <td className="px-3 py-2.5">
          <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </motion.div>
        </td>
        <td className="px-3 py-2.5">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.bgColor} ${cfg.color}`}>
            <cfg.Icon className="h-3 w-3" />
            {row.tipo === "acesso" ? "Acesso" : row.tipo === "formulario" ? "Formulário" : row.tipo.charAt(0).toUpperCase() + row.tipo.slice(1)}
          </span>
        </td>
        <td className="px-3 py-2.5 text-foreground/80 tabular-nums whitespace-nowrap">{format(parseISO(row.data_hora), "dd/MM/yyyy 'às' HH:mm:ss")}</td>
        <td className="px-3 py-2.5">
          {row.nome ? <span className="text-foreground font-medium">{row.nome}</span>
            : <span className="text-foreground/60">{[row.cidade, row.estado].filter(Boolean).join(", ") || "—"}</span>}
          {row.contador_visitas && row.contador_visitas > 1 && (
            <span className="ml-1.5 rounded-full bg-secondary/10 px-1.5 py-0.5 text-[9px] font-medium text-secondary">Retorno</span>
          )}
        </td>
        <td className="px-3 py-2.5 max-w-[180px]">
          <CompactLocation data={row} />
        </td>
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-foreground/70">
            <DeviceIcon device={row.dispositivo} />
            <span className="text-[10px]">{row.sistema_operacional || "—"}</span>
          </div>
        </td>
        <td className="px-3 py-2.5 text-foreground/50 tabular-nums">{maskIp(row.endereco_ip)}</td>
        <td className="px-3 py-2.5">
          <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-muted-foreground">{origin}</span>
          {row.utm_campaign && <span className="ml-1 rounded bg-primary/5 px-1.5 py-0.5 text-[9px] text-primary/70">{row.utm_campaign}</span>}
        </td>
        <td className="px-3 py-2.5"><ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} /></td>
      </tr>
      <AnimatePresence>
        {expanded && (
          <tr><td colSpan={9} className="p-0">
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <ExpandedDetail row={row} toast={toast} />
            </motion.div>
          </td></tr>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Expanded Detail ──
function ExpandedDetail({ row, toast }: { row: UnifiedInteraction; toast: any }) {
  const handleCopy = (text: string) => toast({ title: "Copiado!" });

  return (
    <div className="bg-white/[0.01] border-t border-border/20 px-6 py-5 space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <FullLocationDetail data={row} onCopy={handleCopy} />

        <DetailSection title="Dispositivo e Acesso">
          <DetailItem label="Dispositivo" value={row.dispositivo} />
          <DetailItem label="Sistema Operacional" value={row.sistema_operacional} />
          <DetailItem label="Navegador" value={row.navegador} />
          {row.largura_tela && row.altura_tela && <DetailItem label="Resolução" value={`${row.largura_tela}×${row.altura_tela}`} />}
          <DetailItem label="IP Completo" value={row.endereco_ip} copyable />
        </DetailSection>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {row.tipo === "formulario" && (
          <DetailSection title="Dados do Formulário">
            <DetailItem label="Nome" value={row.nome} />
            <DetailItem label="Telefone" value={row.telefone} copyable />
            <DetailItem label="Email" value={row.email} />
            <DetailItem label="Mensagem" value={row.mensagem} />
            <DetailItem label="Lida" value={row.lida ? "Sim" : "Não"} />
          </DetailSection>
        )}
        {(row.tipo === "whatsapp" || row.tipo === "instagram" || row.tipo === "facebook") && (
          <DetailSection title="Detalhes do Clique">
            <DetailItem label="Texto do Botão" value={row.texto_botao} />
            <DetailItem label="Seção da Página" value={row.secao_pagina} />
            <DetailItem label="URL Destino" value={row.url_destino} />
          </DetailSection>
        )}
        {row.tipo === "acesso" && (
          <DetailSection title="Comportamento">
            <DetailItem label="Página Visitada" value={formatPageName(row.pagina)} />
            <DetailItem label="Primeira Visita" value={row.primeira_visita ? "Sim" : "Não"} />
            <DetailItem label="Nº de Visitas" value={String(row.contador_visitas || 1)} />
          </DetailSection>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-border/20">
        {row.telefone && (
          <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(row.telefone!); toast({ title: "Telefone copiado!" }); }}
            className="flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-1.5 text-[11px] font-medium text-success hover:bg-success/20 transition-colors">
            <Copy className="h-3 w-3" /> Copiar Telefone
          </button>
        )}
        {row.url_destino && (
          <a href={row.url_destino} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ExternalLink className="h-3 w-3" /> Abrir URL
          </a>
        )}
      </div>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">{title}</h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function DetailItem({ label, value, copyable }: { label: string; value?: string | null; copyable?: boolean }) {
  const display = value || "—";
  return (
    <div className="flex items-start gap-2 text-[11px]">
      <span className="text-muted-foreground shrink-0 w-28">{label}</span>
      <span className={`text-foreground/80 break-all ${!value ? "text-muted-foreground/40" : ""}`}>{display}</span>
      {copyable && value && (
        <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(value); }} className="shrink-0 text-muted-foreground/40 hover:text-primary transition-colors">
          <Copy className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
