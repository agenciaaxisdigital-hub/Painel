import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GEMINI_MODEL = "gemini-2.5-flash";

const SYSTEM_PROMPT = `Você é Fernanda Sarelli, a assistente virtual inteligente do Painel de gestão de dados eleitorais de Goiás 2026.

Você tem acesso TOTAL e COMPLETO a todos os dados do painel em tempo real. Você recebe dumps completos dos dados a cada pergunta.

Suas especialidades:
- Estratégia de campanha política e eleitoral
- Zonas eleitorais de Goiânia (1ª, 2ª, 127ª, 133ª, 134ª, 135ª, 136ª, 146ª e 147ª)
- Regiões de planejamento do estado de Goiás
- Marketing digital, tráfego pago (Meta Ads, Google Ads), SEO
- Análise comparativa de períodos (semana vs anterior, mês vs anterior)
- Projeções e estimativas baseadas em tendências dos dados
- Funil de engajamento (visitantes → cliques → formulários)
- Análise de UTM e performance de campanhas de tráfego
- Taxa de conversão e otimização
- Análise geográfica por cidade, bairro, zona eleitoral e região
- Horários e dias de pico de engajamento
- Comportamento por dispositivo (mobile vs desktop)
- Qualquer pergunta geral sobre política, marketing ou dados

Dados de referência das zonas eleitorais de Goiânia (total: 1.036.218 eleitores):
- 1ª Zona: 132.598 eleitores (centro-leste) — Setor Central, Marista, Bueno
- 2ª Zona: 114.960 eleitores (centro) — Centro, Campinas, Setor Oeste
- 127ª Zona: 154.000 eleitores (sul-central) — Jardim América, Setor Sul
- 133ª Zona: 134.028 eleitores (sudeste) — Jardim da Luz, Vila União
- 134ª Zona: 159.000 eleitores (oeste) — maior zona — Jardim Europa, Goiânia 2
- 135ª Zona: 120.000 eleitores (leste) — Jardim Novo Mundo, Vila Brasília
- 136ª Zona: 140.000 eleitores (sul) — Aparecida de Goiânia norte
- 146ª Zona: 114.000 eleitores (norte) — Goiânia Norte, Jardim Guanabara
- 147ª Zona: 118.000 eleitores (noroeste-central)

REGRAS IMPORTANTES:
1. Sempre use os dados reais fornecidos no contexto. NUNCA invente números.
2. Quando fizer comparativos, mostre variação percentual (ex: +15%, -8%).
3. Formate respostas com markdown: use **negrito**, tabelas, listas e headers quando apropriado.
4. Dê recomendações estratégicas diretas e acionáveis.
5. Se perguntarem sobre projeções, extrapole com base nas tendências dos dados disponíveis.
6. Seja calorosa, inteligente e concisa.
7. Sempre responda em português brasileiro.
8. Nunca diga que não pode acessar dados — você PODE e TEM todos os dados.
9. Para perguntas sobre "hoje", "esta semana", "este mês", use as datas dos dados para calcular.
10. Priorize insights acionáveis que ajudem a campanha a tomar melhores decisões.`;

interface GeminiMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

function getDateRanges() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const thisWeekStart = new Date(today); thisWeekStart.setDate(today.getDate() - today.getDay());
  const lastWeekStart = new Date(thisWeekStart); lastWeekStart.setDate(thisWeekStart.getDate() - 7);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const last7 = new Date(today); last7.setDate(today.getDate() - 7);
  const last30 = new Date(today); last30.setDate(today.getDate() - 30);
  const last60 = new Date(today); last60.setDate(today.getDate() - 60);

  return { now, today, yesterday, thisWeekStart, lastWeekStart, thisMonthStart, lastMonthStart, last7, last30, last60 };
}

function buildStats(records: any[], field: string): Record<string, number> {
  const stats: Record<string, number> = {};
  records?.forEach((r) => {
    const val = r[field];
    if (val) stats[val] = (stats[val] || 0) + 1;
  });
  return stats;
}

function topN(stats: Record<string, number>, n = 15): string {
  return Object.entries(stats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
}

function countInRange(records: any[], field: string, start: Date, end: Date): number {
  return records?.filter(r => {
    const d = new Date(r[field]);
    return d >= start && d < end;
  }).length || 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY não configurada");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { message, history, currentRoute } = await req.json();
    const dates = getDateRanges();

    // Fetch ALL data comprehensively
    const [
      { count: totalVisitantes },
      { count: totalFormularios },
      { count: totalCliques },
      { data: acessos },
      { data: formularios },
      { data: cliques },
    ] = await Promise.all([
      supabase.from("acessos_site").select("*", { count: "exact", head: true }),
      supabase.from("mensagens_contato").select("*", { count: "exact", head: true }),
      supabase.from("cliques_whatsapp").select("*", { count: "exact", head: true }),
      supabase
        .from("acessos_site")
        .select("cidade, estado, dispositivo, pagina, criado_em, cookie_visitante, navegador, sistema_operacional, bairro, zona_eleitoral, regiao_planejamento, utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer, primeira_visita")
        .order("criado_em", { ascending: false })
        .limit(1000),
      supabase
        .from("mensagens_contato")
        .select("nome, cidade, estado, criado_em, telefone, email, bairro, zona_eleitoral, regiao_planejamento, lida")
        .order("criado_em", { ascending: false })
        .limit(500),
      supabase
        .from("cliques_whatsapp")
        .select("tipo_clique, cidade, estado, criado_em, dispositivo, navegador, sistema_operacional, bairro, zona_eleitoral, regiao_planejamento, secao_pagina, texto_botao, pagina_origem")
        .order("criado_em", { ascending: false })
        .limit(500),
    ]);

    // === AGGREGATE STATS ===
    const cidadeStats = buildStats(acessos || [], "cidade");
    const bairroStats = buildStats(acessos || [], "bairro");
    const dispositivoStats = buildStats(acessos || [], "dispositivo");
    const navegadorStats = buildStats(acessos || [], "navegador");
    const soStats = buildStats(acessos || [], "sistema_operacional");
    const zonaStats = buildStats(acessos || [], "zona_eleitoral");
    const regiaoStats = buildStats(acessos || [], "regiao_planejamento");
    const paginaStats = buildStats(acessos || [], "pagina");
    const utmSourceStats = buildStats(acessos || [], "utm_source");
    const utmMediumStats = buildStats(acessos || [], "utm_medium");
    const utmCampaignStats = buildStats(acessos || [], "utm_campaign");
    const referrerStats = buildStats(acessos || [], "referrer");

    // Click breakdown
    const clickTypeStats = buildStats(cliques || [], "tipo_clique");
    const clickSectionStats = buildStats(cliques || [], "secao_pagina");
    const clickBtnStats = buildStats(cliques || [], "texto_botao");
    const clickZonaStats = buildStats(cliques || [], "zona_eleitoral");

    // Form breakdown
    const formCidadeStats = buildStats(formularios || [], "cidade");
    const formZonaStats = buildStats(formularios || [], "zona_eleitoral");
    const formsNaoLidas = formularios?.filter(f => !f.lida).length || 0;

    // === TIME-BASED COMPARISONS ===
    const acessosHoje = countInRange(acessos || [], "criado_em", dates.today, dates.now);
    const acessosOntem = countInRange(acessos || [], "criado_em", dates.yesterday, dates.today);
    const acessosEstaSemana = countInRange(acessos || [], "criado_em", dates.thisWeekStart, dates.now);
    const acessosSemanaPassada = countInRange(acessos || [], "criado_em", dates.lastWeekStart, dates.thisWeekStart);
    const acessosUlt7 = countInRange(acessos || [], "criado_em", dates.last7, dates.now);
    const acessosUlt30 = countInRange(acessos || [], "criado_em", dates.last30, dates.now);
    const acessos30a60 = countInRange(acessos || [], "criado_em", dates.last60, dates.last30);

    const formsHoje = countInRange(formularios || [], "criado_em", dates.today, dates.now);
    const formsEstaSemana = countInRange(formularios || [], "criado_em", dates.thisWeekStart, dates.now);
    const formsSemanaPassada = countInRange(formularios || [], "criado_em", dates.lastWeekStart, dates.thisWeekStart);
    const formsUlt30 = countInRange(formularios || [], "criado_em", dates.last30, dates.now);

    const cliquesHoje = countInRange(cliques || [], "criado_em", dates.today, dates.now);
    const cliquesEstaSemana = countInRange(cliques || [], "criado_em", dates.thisWeekStart, dates.now);
    const cliquesSemanaPassada = countInRange(cliques || [], "criado_em", dates.lastWeekStart, dates.thisWeekStart);

    // === HOURLY DISTRIBUTION ===
    const hourlyDist: Record<number, number> = {};
    acessos?.forEach(a => {
      const h = new Date(a.criado_em).getHours();
      hourlyDist[h] = (hourlyDist[h] || 0) + 1;
    });
    const peakHours = Object.entries(hourlyDist)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([h, c]) => `${h}h: ${c} acessos`)
      .join(", ");

    // === DAY OF WEEK ===
    const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const dayDist: Record<string, number> = {};
    acessos?.forEach(a => {
      const d = dayNames[new Date(a.criado_em).getDay()];
      dayDist[d] = (dayDist[d] || 0) + 1;
    });

    // === UNIQUE VISITORS ===
    const uniqueVisitors = new Set(acessos?.map(a => a.cookie_visitante).filter(Boolean)).size;
    const newVisitors = acessos?.filter(a => a.primeira_visita).length || 0;
    const returningVisitors = (acessos?.length || 0) - newVisitors;

    // === CONVERSION RATES ===
    const taxaConversaoGeral = totalVisitantes ? ((totalFormularios || 0) / totalVisitantes * 100).toFixed(2) : "0";
    const taxaCliquesGeral = totalVisitantes ? ((totalCliques || 0) / totalVisitantes * 100).toFixed(2) : "0";

    // === RECENT RECORDS ===
    const recentForms = formularios?.slice(0, 10).map(f => ({
      nome: f.nome,
      cidade: f.cidade,
      bairro: f.bairro,
      zona: f.zona_eleitoral,
      data: f.criado_em,
      lida: f.lida,
    }));

    const dataContext = `
DADOS COMPLETOS DO DASHBOARD (tempo real, ${dates.now.toLocaleString("pt-BR")}):

═══ TOTAIS GERAIS ═══
- Total de acessos ao site: ${totalVisitantes || 0}
- Total de formulários recebidos: ${totalFormularios || 0}
- Total de cliques sociais: ${totalCliques || 0}
- Visitantes únicos (últimos 1000 registros): ${uniqueVisitors}
- Visitantes novos vs retornantes: ${newVisitors} novos / ${returningVisitors} retornantes
- Formulários não lidos: ${formsNaoLidas}

═══ COMPARATIVO DE PERÍODOS ═══
Acessos:
- Hoje: ${acessosHoje} | Ontem: ${acessosOntem}
- Esta semana: ${acessosEstaSemana} | Semana passada: ${acessosSemanaPassada} | Variação: ${acessosSemanaPassada ? ((acessosEstaSemana - acessosSemanaPassada) / acessosSemanaPassada * 100).toFixed(1) : "N/A"}%
- Últimos 7 dias: ${acessosUlt7}
- Últimos 30 dias: ${acessosUlt30} | 30 dias anteriores: ${acessos30a60} | Variação: ${acessos30a60 ? ((acessosUlt30 - acessos30a60) / acessos30a60 * 100).toFixed(1) : "N/A"}%

Formulários:
- Hoje: ${formsHoje}
- Esta semana: ${formsEstaSemana} | Semana passada: ${formsSemanaPassada}
- Últimos 30 dias: ${formsUlt30}

Cliques:
- Hoje: ${cliquesHoje}
- Esta semana: ${cliquesEstaSemana} | Semana passada: ${cliquesSemanaPassada}

═══ TAXAS DE CONVERSÃO ═══
- Visitante → Formulário: ${taxaConversaoGeral}%
- Visitante → Clique social: ${taxaCliquesGeral}%

═══ FUNIL DE ENGAJAMENTO ═══
Visitantes (${totalVisitantes}) → Cliques (${totalCliques}) → Formulários (${totalFormularios})

═══ TOP CIDADES (acessos) ═══
${topN(cidadeStats)}

═══ TOP BAIRROS (acessos) ═══
${topN(bairroStats)}

═══ ZONAS ELEITORAIS (acessos) ═══
${topN(zonaStats)}

═══ REGIÕES DE PLANEJAMENTO (acessos) ═══
${topN(regiaoStats)}

═══ DISPOSITIVOS ═══
${topN(dispositivoStats)}

═══ NAVEGADORES ═══
${topN(navegadorStats)}

═══ SISTEMAS OPERACIONAIS ═══
${topN(soStats)}

═══ PÁGINAS MAIS ACESSADAS ═══
${topN(paginaStats)}

═══ UTM - FONTES DE TRÁFEGO ═══
utm_source: ${topN(utmSourceStats) || "Nenhum UTM registrado"}
utm_medium: ${topN(utmMediumStats) || "—"}
utm_campaign: ${topN(utmCampaignStats) || "—"}

═══ REFERRERS ═══
${topN(referrerStats) || "—"}

═══ CLIQUES SOCIAIS - DETALHAMENTO ═══
Por tipo: ${topN(clickTypeStats)}
Por seção da página: ${topN(clickSectionStats)}
Por texto do botão: ${topN(clickBtnStats)}
Por zona eleitoral: ${topN(clickZonaStats)}

═══ FORMULÁRIOS POR GEOGRAFIA ═══
Cidades: ${topN(formCidadeStats)}
Zonas eleitorais: ${topN(formZonaStats)}

═══ HORÁRIOS DE PICO ═══
${peakHours || "Sem dados suficientes"}

═══ DIAS DA SEMANA ═══
${Object.entries(dayDist).sort(([,a],[,b]) => b - a).map(([d,c]) => `${d}: ${c}`).join(", ") || "—"}

═══ ÚLTIMOS FORMULÁRIOS ═══
${JSON.stringify(recentForms || [])}

Módulo atual do usuário: ${currentRoute || "Visão Geral"}
`;

    // Build conversation
    const contents: GeminiMessage[] = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: `${dataContext}\n\nPergunta do usuário: ${message}` }],
    });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      throw new Error(`Gemini API error [${geminiResponse.status}]: ${errorBody}`);
    }

    const geminiData = await geminiResponse.json();
    const reply =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Desculpe, não consegui gerar uma resposta. Tente novamente.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Sarelli error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
