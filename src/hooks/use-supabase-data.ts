import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, format, parseISO } from "date-fns";
import { useEffect, useState, useRef } from "react";
import { toast } from "@/hooks/use-toast";

function getSince(days: number) {
  return subDays(new Date(), days).toISOString();
}

// ==================== COUNTS ====================
export function useTableCounts(days: number) {
  return useQuery({
    queryKey: ["table-counts", days],
    queryFn: async () => {
      const since = getSince(days);
      const [v, f, wh, ig, fb] = await Promise.all([
        supabase.from("acessos_site").select("*", { count: "exact", head: true }).gte("criado_em", since),
        supabase.from("mensagens_contato").select("*", { count: "exact", head: true }).gte("criado_em", since),
        supabase.from("cliques_whatsapp").select("*", { count: "exact", head: true }).gte("criado_em", since).eq("tipo_clique", "whatsapp"),
        supabase.from("cliques_whatsapp").select("*", { count: "exact", head: true }).gte("criado_em", since).eq("tipo_clique", "instagram"),
        supabase.from("cliques_whatsapp").select("*", { count: "exact", head: true }).gte("criado_em", since).eq("tipo_clique", "facebook"),
      ]);
      const vc = v.count ?? 0;
      const fc = f.count ?? 0;
      return {
        visitantes: vc,
        formularios: fc,
        whatsapp: wh.count ?? 0,
        instagram: ig.count ?? 0,
        facebook: fb.count ?? 0,
        taxaConversao: vc > 0 ? (fc / vc) * 100 : 0,
      };
    },
    staleTime: 30_000,
  });
}

export function useVariation(days: number) {
  return useQuery({
    queryKey: ["variation", days],
    queryFn: async () => {
      const currentSince = getSince(days);
      const previousSince = subDays(new Date(), days * 2).toISOString();
      const [cV, pV, cF, pF, cW, pW, cI, pI] = await Promise.all([
        supabase.from("acessos_site").select("*", { count: "exact", head: true }).gte("criado_em", currentSince),
        supabase.from("acessos_site").select("*", { count: "exact", head: true }).gte("criado_em", previousSince).lt("criado_em", currentSince),
        supabase.from("mensagens_contato").select("*", { count: "exact", head: true }).gte("criado_em", currentSince),
        supabase.from("mensagens_contato").select("*", { count: "exact", head: true }).gte("criado_em", previousSince).lt("criado_em", currentSince),
        supabase.from("cliques_whatsapp").select("*", { count: "exact", head: true }).gte("criado_em", currentSince).eq("tipo_clique", "whatsapp"),
        supabase.from("cliques_whatsapp").select("*", { count: "exact", head: true }).gte("criado_em", previousSince).lt("criado_em", currentSince).eq("tipo_clique", "whatsapp"),
        supabase.from("cliques_whatsapp").select("*", { count: "exact", head: true }).gte("criado_em", currentSince).eq("tipo_clique", "instagram"),
        supabase.from("cliques_whatsapp").select("*", { count: "exact", head: true }).gte("criado_em", previousSince).lt("criado_em", currentSince).eq("tipo_clique", "instagram"),
      ]);
      const calc = (curr: number, prev: number) => (prev > 0 ? ((curr - prev) / prev) * 100 : curr > 0 ? 100 : 0);
      return {
        visitantes: calc(cV.count ?? 0, pV.count ?? 0),
        formularios: calc(cF.count ?? 0, pF.count ?? 0),
        whatsapp: calc(cW.count ?? 0, pW.count ?? 0),
        instagram: calc(cI.count ?? 0, pI.count ?? 0),
      };
    },
    staleTime: 60_000,
  });
}

// ==================== TIME SERIES ====================
export function useTimeSeries(days: number) {
  return useQuery({
    queryKey: ["time-series", days],
    queryFn: async () => {
      const since = getSince(days);
      const [vis, forms, clicks] = await Promise.all([
        supabase.from("acessos_site").select("criado_em").gte("criado_em", since).limit(1000),
        supabase.from("mensagens_contato").select("criado_em").gte("criado_em", since).limit(1000),
        supabase.from("cliques_whatsapp").select("criado_em, tipo_clique").gte("criado_em", since).limit(1000),
      ]);

      const dayMap: Record<string, { visitantes: number; formularios: number; whatsapp: number; instagram: number; facebook: number }> = {};
      for (let i = 0; i < days; i++) {
        const key = format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd");
        dayMap[key] = { visitantes: 0, formularios: 0, whatsapp: 0, instagram: 0, facebook: 0 };
      }

      (vis.data || []).forEach((r) => {
        const key = format(parseISO(r.criado_em), "yyyy-MM-dd");
        if (dayMap[key]) dayMap[key].visitantes++;
      });
      (forms.data || []).forEach((r) => {
        const key = format(parseISO(r.criado_em), "yyyy-MM-dd");
        if (dayMap[key]) dayMap[key].formularios++;
      });
      (clicks.data || []).forEach((r) => {
        const key = format(parseISO(r.criado_em), "yyyy-MM-dd");
        if (dayMap[key]) {
          const t = r.tipo_clique || "whatsapp";
          if (t === "whatsapp") dayMap[key].whatsapp++;
          else if (t === "instagram") dayMap[key].instagram++;
          else if (t === "facebook") dayMap[key].facebook++;
        }
      });

      return Object.entries(dayMap).map(([date, values]) => ({
        date: format(parseISO(date), "dd/MM"),
        ...values,
      }));
    },
    staleTime: 60_000,
  });
}

// ==================== TABLE DATA ====================
export function useVisitantes(days: number) {
  return useQuery({
    queryKey: ["visitantes-table", days],
    queryFn: async () => {
      const since = getSince(days);
      const { data, error } = await supabase
        .from("acessos_site")
        .select("*")
        .gte("criado_em", since)
        .order("criado_em", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });
}

export function useFormularios(days: number) {
  return useQuery({
    queryKey: ["formularios-table", days],
    queryFn: async () => {
      const since = getSince(days);
      const { data, error } = await supabase
        .from("mensagens_contato")
        .select("*")
        .gte("criado_em", since)
        .order("criado_em", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });
}

export function useCliques(days: number) {
  return useQuery({
    queryKey: ["cliques-table", days],
    queryFn: async () => {
      const since = getSince(days);
      const { data, error } = await supabase
        .from("cliques_whatsapp")
        .select("*")
        .gte("criado_em", since)
        .order("criado_em", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });
}

// ==================== AGGREGATIONS ====================
export function useDeviceBreakdown(days: number) {
  return useQuery({
    queryKey: ["device-breakdown", days],
    queryFn: async () => {
      const since = getSince(days);
      const { data } = await supabase.from("acessos_site").select("dispositivo").gte("criado_em", since).limit(1000);
      return aggregate(data || [], "dispositivo");
    },
    staleTime: 60_000,
  });
}

export function useTrafficOrigin(days: number) {
  return useQuery({
    queryKey: ["traffic-origin", days],
    queryFn: async () => {
      const since = getSince(days);
      const { data } = await supabase.from("acessos_site").select("referrer, utm_source").gte("criado_em", since).limit(1000);
      const items = (data || []).map((r) => {
        if (r.utm_source) return r.utm_source;
        if (r.referrer?.includes("google")) return "Google";
        if (r.referrer?.includes("instagram")) return "Instagram";
        if (r.referrer?.includes("whatsapp")) return "WhatsApp";
        if (r.referrer?.includes("facebook")) return "Facebook";
        if (!r.referrer) return "Direto";
        return "Outro";
      });
      const counts: Record<string, number> = {};
      items.forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
      const total = items.length;
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value, percentage: total > 0 ? ((value / total) * 100).toFixed(1) : "0" }));
    },
    staleTime: 60_000,
  });
}

export function useClickPlatforms(days: number) {
  return useQuery({
    queryKey: ["click-platforms", days],
    queryFn: async () => {
      const since = getSince(days);
      const { data } = await supabase.from("cliques_whatsapp").select("tipo_clique").gte("criado_em", since).limit(1000);
      return aggregate(data || [], "tipo_clique");
    },
    staleTime: 60_000,
  });
}

export function useTopCities(days: number) {
  return useQuery({
    queryKey: ["top-cities", days],
    queryFn: async () => {
      const since = getSince(days);
      const { data } = await supabase.from("acessos_site").select("cidade").gte("criado_em", since).limit(1000);
      const counts: Record<string, number> = {};
      (data || []).forEach((r) => { if (r.cidade && r.cidade.trim()) { counts[r.cidade] = (counts[r.cidade] || 0) + 1; } });
      return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([cidade, visitantes]) => ({ cidade, visitantes }));
    },
    staleTime: 60_000,
  });
}

export function useTopPages(days: number) {
  return useQuery({
    queryKey: ["top-pages", days],
    queryFn: async () => {
      const since = getSince(days);
      const { data } = await supabase.from("acessos_site").select("pagina").gte("criado_em", since).limit(1000);
      const counts: Record<string, number> = {};
      (data || []).forEach((r) => { counts[r.pagina] = (counts[r.pagina] || 0) + 1; });
      return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([pagina, visitas]) => ({ pagina, visitas }));
    },
    staleTime: 60_000,
  });
}

// ==================== CONNECTION STATUS ====================
export function useConnectionStatus() {
  return useQuery({
    queryKey: ["connection-status"],
    queryFn: async () => {
      const [v, f, c] = await Promise.all([
        supabase.from("acessos_site").select("criado_em", { count: "exact" }).order("criado_em", { ascending: false }).limit(1),
        supabase.from("mensagens_contato").select("criado_em", { count: "exact" }).order("criado_em", { ascending: false }).limit(1),
        supabase.from("cliques_whatsapp").select("criado_em", { count: "exact" }).order("criado_em", { ascending: false }).limit(1),
      ]);
      const lastRecord = [v.data?.[0]?.criado_em, f.data?.[0]?.criado_em, c.data?.[0]?.criado_em].filter(Boolean).sort().reverse()[0] || null;
      const minutesSince = lastRecord ? (Date.now() - new Date(lastRecord).getTime()) / 60000 : Infinity;
      return {
        connected: true,
        lastRecord,
        minutesSince,
        status: (minutesSince < 30 ? "green" : "yellow") as "green" | "yellow",
        counts: { visitantes: v.count ?? 0, formularios: f.count ?? 0, cliques: c.count ?? 0 },
      };
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

// ==================== REAL-TIME FEED ====================
export function useRealtimeFeed() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecent = async () => {
      const [vis, forms, clicks] = await Promise.all([
        supabase.from("acessos_site").select("id, criado_em, cidade, dispositivo").order("criado_em", { ascending: false }).limit(10),
        supabase.from("mensagens_contato").select("id, criado_em, cidade, nome").order("criado_em", { ascending: false }).limit(5),
        supabase.from("cliques_whatsapp").select("id, criado_em, cidade, tipo_clique").order("criado_em", { ascending: false }).limit(5),
      ]);
      const all = [
        ...(vis.data || []).map((r) => ({ ...r, tipo: "visita" as const, label: "visitou o site" })),
        ...(forms.data || []).map((r) => ({ ...r, tipo: "formulario" as const, label: `${r.nome} enviou formulário` })),
        ...(clicks.data || []).map((r) => ({ ...r, tipo: (r.tipo_clique || "whatsapp") as string, label: `clicou no ${r.tipo_clique || "WhatsApp"}` })),
      ].sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()).slice(0, 20);
      setEvents(all);
    };
    fetchRecent();

    const channel = supabase
      .channel("feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "acessos_site" }, (p) => {
        if (p.eventType === "INSERT") {
          setEvents((prev) => [{ ...p.new, tipo: "visita", label: "visitou o site" }, ...prev].slice(0, 20));
        } else if (p.eventType === "UPDATE") {
          setEvents((prev) => prev.map((e) => e.id === (p.new as any).id ? { ...e, ...p.new } : e));
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "cliques_whatsapp" }, (p) => {
        const r = p.new as any;
        if (p.eventType === "INSERT") {
          setEvents((prev) => [{ ...r, tipo: r.tipo_clique || "whatsapp", label: `clicou no ${r.tipo_clique || "WhatsApp"}` }, ...prev].slice(0, 20));
        } else if (p.eventType === "UPDATE") {
          setEvents((prev) => prev.map((e) => e.id === r.id ? { ...e, ...r } : e));
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "mensagens_contato" }, (p) => {
        const r = p.new as any;
        if (p.eventType === "INSERT") {
          setEvents((prev) => [{ ...r, tipo: "formulario", label: `${r.nome} enviou formulário` }, ...prev].slice(0, 20));
        } else if (p.eventType === "UPDATE") {
          setEvents((prev) => prev.map((e) => e.id === r.id ? { ...e, ...r } : e));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return events;
}

// ==================== HOURLY HEATMAP ====================
export function useHourlyHeatmap(days: number, tipoClique?: string) {
  return useQuery({
    queryKey: ["hourly-heatmap", days, tipoClique],
    queryFn: async () => {
      const since = getSince(days);
      let query = supabase.from("cliques_whatsapp").select("criado_em").gte("criado_em", since).limit(1000);
      if (tipoClique) query = query.eq("tipo_clique", tipoClique);
      const { data } = await query;

      const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      const grid: { dia: string; hora: number; valor: number }[] = [];
      const counts: Record<string, number> = {};

      (data || []).forEach((r) => {
        const d = new Date(r.criado_em);
        const key = `${d.getDay()}-${d.getHours()}`;
        counts[key] = (counts[key] || 0) + 1;
      });

      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        for (let h = 0; h < 24; h++) {
          grid.push({ dia: dias[dayIdx], hora: h, valor: counts[`${dayIdx}-${h}`] || 0 });
        }
      }
      return grid;
    },
    staleTime: 60_000,
  });
}

// ==================== HELPERS ====================
function aggregate(data: any[], field: string) {
  const counts: Record<string, number> = {};
  data.forEach((r) => { const v = r[field] || "Desconhecido"; counts[v] = (counts[v] || 0) + 1; });
  const total = data.length;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, percentage: total > 0 ? ((value / total) * 100).toFixed(1) : "0" }));
}

export function formatTempoAtras(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `há ${diff}s`;
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  return `há ${Math.floor(diff / 86400)}d`;
}
