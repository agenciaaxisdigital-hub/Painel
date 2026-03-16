import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GEMINI_MODEL = "gemini-2.5-flash";

const SYSTEM_PROMPT = `Você é Fernanda Sarelli, a gerente de negócio e assistente estratégica da campanha política Chama Rosa para Deputada Estadual em Goiás 2026.

Você NÃO é apenas uma assistente — você é a GERENTE DE NEGÓCIO da campanha. Você conhece CADA detalhe de CADA dado. Quando alguém pergunta algo, você responde com autoridade total, como quem vive e respira esses dados 24h por dia.

Você tem acesso TOTAL e COMPLETO a todos os dados do painel de campanha em tempo real. Você recebe dumps completos dos dados a cada pergunta.

## SUA PERSONALIDADE
- Você é assertiva, inteligente e estratégica
- Você fala com confiança porque CONHECE os dados profundamente
- Você não apenas mostra números — você INTERPRETA, COMPARA e dá RECOMENDAÇÕES
- Você antecipa necessidades: se perguntam sobre uma zona, você já compara com outras
- Você sempre contextualiza: "isso representa X% do total", "comparado com a semana passada..."
- Você é proativa: sugere ações mesmo quando não pedem

## SUAS ESPECIALIDADES
- Estratégia de campanha política e eleitoral completa
- Zonas eleitorais de Goiânia (1ª, 2ª, 127ª, 133ª, 134ª, 135ª, 136ª, 146ª e 147ª)
- Regiões de planejamento do estado de Goiás
- Marketing digital, tráfego pago (Meta Ads, Google Ads), SEO, funis de conversão
- Análise comparativa profunda de períodos (hora a hora, dia a dia, semana, mês)
- Projeções e estimativas baseadas em tendências dos dados
- Funil completo de engajamento (visitantes → cliques → formulários → contato)
- Análise de UTM e performance de campanhas de tráfego (qual fonte converte mais)
- Taxa de conversão por etapa do funil e por segmento
- Análise geográfica profunda por cidade, bairro, zona eleitoral e região
- Mapa de calor: horários e dias de pico de engajamento
- Comportamento por dispositivo (mobile vs desktop), navegador e SO
- Análise de retenção (visitantes novos vs retornantes)
- Qualquer pergunta geral sobre política, marketing, dados ou estratégia

## DADOS DE REFERÊNCIA — ZONAS ELEITORAIS DE GOIÂNIA (total: 1.036.218 eleitores)
- 1ª Zona: 132.598 eleitores (centro-leste) — Setor Central, Marista, Bueno
- 2ª Zona: 114.960 eleitores (centro) — Centro, Campinas, Setor Oeste
- 127ª Zona: 154.000 eleitores (sul-central) — Jardim América, Setor Sul
- 133ª Zona: 134.028 eleitores (sudeste) — Jardim da Luz, Vila União
- 134ª Zona: 159.000 eleitores (oeste) — MAIOR zona — Jardim Europa, Goiânia 2
- 135ª Zona: 120.000 eleitores (leste) — Jardim Novo Mundo, Vila Brasília
- 136ª Zona: 140.000 eleitores (sul) — Aparecida de Goiânia norte
- 146ª Zona: 114.000 eleitores (norte) — Goiânia Norte, Jardim Guanabara
- 147ª Zona: 118.000 eleitores (noroeste-central)

## REGRAS ABSOLUTAS
1. SEMPRE use os dados reais fornecidos no contexto. NUNCA invente números.
2. SEMPRE faça comparativos automáticos: mostre variação percentual (ex: +15%, -8%).
3. Formate respostas com markdown rico: **negrito**, tabelas, listas, headers, emojis quando apropriado.
4. Dê recomendações estratégicas DIRETAS e ACIONÁVEIS — como uma gerente de verdade faria.
5. Se perguntarem sobre projeções, extrapole com base nas tendências reais dos dados.
6. Seja calorosa, inteligente, assertiva e concisa.
7. SEMPRE responda em português brasileiro.
8. NUNCA diga que não pode acessar dados — você PODE e TEM todos os dados.
9. Para perguntas temporais, use as datas dos dados para calcular com precisão.
10. SEMPRE calcule a PENETRAÇÃO: compare acessos/cliques com o total de eleitores da zona.
11. Quando falar de zonas, SEMPRE inclua: acessos, cliques, formulários, penetração (%) e tendência.
12. Se o dado é zero ou ausente, diga claramente e sugira ações para melhorar.
13. CRUZE dados automaticamente: ex. "a zona 134ª tem mais acessos mas converte menos que a 127ª"
14. Use tabelas markdown para comparações entre zonas/cidades/períodos.
15. SEMPRE termine com 1-3 recomendações acionáveis.`;

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

function topN(stats: Record<string, number>, n = 20): string {
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

function pctChange(current: number, previous: number): string {
  if (!previous) return current > 0 ? "+∞%" : "0%";
  const pct = ((current - previous) / previous * 100).toFixed(1);
  return Number(pct) >= 0 ? `+${pct}%` : `${pct}%`;
}

function buildCrossStats(acessos: any[], cliques: any[], forms: any[], field: string): string {
  const aStats = buildStats(acessos, field);
  const cStats = buildStats(cliques, field);
  const fStats = buildStats(forms, field);
  const allKeys = new Set([...Object.keys(aStats), ...Object.keys(cStats), ...Object.keys(fStats)]);
  
  if (allKeys.size === 0) return "Sem dados";
  
  return Array.from(allKeys)
    .map(k => ({
      key: k,
      acessos: aStats[k] || 0,
      cliques: cStats[k] || 0,
      forms: fStats[k] || 0,
      total: (aStats[k] || 0) + (cStats[k] || 0) + (fStats[k] || 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 15)
    .map(r => `${r.key}: ${r.acessos} acessos, ${r.cliques} cliques, ${r.forms} formulários`)
    .join("\n");
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

    // Fetch ALL data comprehensively — increased limits
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
        .select("cidade, estado, dispositivo, pagina, criado_em, cookie_visitante, navegador, sistema_operacional, bairro, zona_eleitoral, regiao_planejamento, utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer, primeira_visita, latitude, longitude, largura_tela, altura_tela, pais, endereco_ip, cep")
        .order("criado_em", { ascending: false })
        .limit(3000),
      supabase
        .from("mensagens_contato")
        .select("nome, cidade, estado, criado_em, telefone, email, bairro, zona_eleitoral, regiao_planejamento, lida, mensagem, cep, pais")
        .order("criado_em", { ascending: false })
        .limit(1000),
      supabase
        .from("cliques_whatsapp")
        .select("tipo_clique, cidade, estado, criado_em, dispositivo, navegador, sistema_operacional, bairro, zona_eleitoral, regiao_planejamento, secao_pagina, texto_botao, pagina_origem, latitude, longitude")
        .order("criado_em", { ascending: false })
        .limit(2000),
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
    const utmContentStats = buildStats(acessos || [], "utm_content");
    const utmTermStats = buildStats(acessos || [], "utm_term");
    const referrerStats = buildStats(acessos || [], "referrer");
    const paisStats = buildStats(acessos || [], "pais");
    const estadoStats = buildStats(acessos || [], "estado");
    const cepStats = buildStats(acessos || [], "cep");

    // Click breakdown
    const clickTypeStats = buildStats(cliques || [], "tipo_clique");
    const clickSectionStats = buildStats(cliques || [], "secao_pagina");
    const clickBtnStats = buildStats(cliques || [], "texto_botao");
    const clickZonaStats = buildStats(cliques || [], "zona_eleitoral");
    const clickCidadeStats = buildStats(cliques || [], "cidade");
    const clickBairroStats = buildStats(cliques || [], "bairro");
    const clickRegiaoStats = buildStats(cliques || [], "regiao_planejamento");
    const clickDispStats = buildStats(cliques || [], "dispositivo");

    // Form breakdown
    const formCidadeStats = buildStats(formularios || [], "cidade");
    const formZonaStats = buildStats(formularios || [], "zona_eleitoral");
    const formBairroStats = buildStats(formularios || [], "bairro");
    const formRegiaoStats = buildStats(formularios || [], "regiao_planejamento");
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
    const formsOntem = countInRange(formularios || [], "criado_em", dates.yesterday, dates.today);
    const formsEstaSemana = countInRange(formularios || [], "criado_em", dates.thisWeekStart, dates.now);
    const formsSemanaPassada = countInRange(formularios || [], "criado_em", dates.lastWeekStart, dates.thisWeekStart);
    const formsUlt30 = countInRange(formularios || [], "criado_em", dates.last30, dates.now);
    const forms30a60 = countInRange(formularios || [], "criado_em", dates.last60, dates.last30);

    const cliquesHoje = countInRange(cliques || [], "criado_em", dates.today, dates.now);
    const cliquesOntem = countInRange(cliques || [], "criado_em", dates.yesterday, dates.today);
    const cliquesEstaSemana = countInRange(cliques || [], "criado_em", dates.thisWeekStart, dates.now);
    const cliquesSemanaPassada = countInRange(cliques || [], "criado_em", dates.lastWeekStart, dates.thisWeekStart);
    const cliquesUlt30 = countInRange(cliques || [], "criado_em", dates.last30, dates.now);

    // === HOURLY DISTRIBUTION ===
    const hourlyDist: Record<number, number> = {};
    acessos?.forEach(a => {
      const h = new Date(a.criado_em).getHours();
      hourlyDist[h] = (hourlyDist[h] || 0) + 1;
    });
    const peakHours = Object.entries(hourlyDist)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([h, c]) => `${h}h: ${c} acessos`)
      .join(", ");
    const fullHourly = Array.from({ length: 24 }, (_, i) => `${i}h: ${hourlyDist[i] || 0}`).join(", ");

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
    const taxaConversaoGeral = totalVisitantes ? ((totalFormularios || 0) / totalVisitantes * 100).toFixed(3) : "0";
    const taxaCliquesGeral = totalVisitantes ? ((totalCliques || 0) / totalVisitantes * 100).toFixed(3) : "0";

    // === SCREEN SIZE ANALYSIS ===
    const mobileCount = acessos?.filter(a => a.dispositivo?.toLowerCase()?.includes("mobile") || a.dispositivo?.toLowerCase()?.includes("celular")).length || 0;
    const desktopCount = acessos?.filter(a => a.dispositivo?.toLowerCase()?.includes("desktop") || a.dispositivo?.toLowerCase()?.includes("computador")).length || 0;
    const tabletCount = acessos?.filter(a => a.dispositivo?.toLowerCase()?.includes("tablet")).length || 0;

    // === CROSS-REFERENCE: ZONAS COMPLETAS ===
    const crossZonas = buildCrossStats(acessos || [], cliques || [], formularios || [], "zona_eleitoral");
    const crossCidades = buildCrossStats(acessos || [], cliques || [], formularios || [], "cidade");
    const crossBairros = buildCrossStats(acessos || [], cliques || [], formularios || [], "bairro");
    const crossRegioes = buildCrossStats(acessos || [], cliques || [], formularios || [], "regiao_planejamento");

    // === RECENT RECORDS ===
    const recentForms = formularios?.slice(0, 15).map(f => ({
      nome: f.nome,
      cidade: f.cidade,
      bairro: f.bairro,
      zona: f.zona_eleitoral,
      regiao: f.regiao_planejamento,
      data: f.criado_em,
      lida: f.lida,
      email: f.email ? "sim" : "não",
      mensagem_preview: f.mensagem?.substring(0, 80),
    }));

    const recentClicks = cliques?.slice(0, 10).map(c => ({
      tipo: c.tipo_clique,
      cidade: c.cidade,
      bairro: c.bairro,
      zona: c.zona_eleitoral,
      secao: c.secao_pagina,
      botao: c.texto_botao,
      data: c.criado_em,
    }));

    // === UTM CONVERSION ANALYSIS ===
    const utmSources = Object.keys(utmSourceStats);
    const utmConversion = utmSources.slice(0, 10).map(src => {
      const srcClicks = cliques?.filter(c => {
        // Match by approximate time window — UTM from same user
        return true; // simplified: show overall utm performance
      }).length || 0;
      return `${src}: ${utmSourceStats[src]} acessos`;
    }).join(", ");

    const dataContext = `
DADOS COMPLETOS DO DASHBOARD — ANÁLISE EM TEMPO REAL
Data/hora atual: ${dates.now.toLocaleString("pt-BR")}
Registros analisados: ${acessos?.length || 0} acessos, ${cliques?.length || 0} cliques, ${formularios?.length || 0} formulários

════════════════════════════════════════
         VISÃO GERAL — TOTAIS
════════════════════════════════════════
- Total de acessos ao site (todos os tempos): ${totalVisitantes || 0}
- Total de formulários recebidos: ${totalFormularios || 0}
- Total de cliques sociais: ${totalCliques || 0}
- Visitantes únicos (amostra): ${uniqueVisitors}
- Novos: ${newVisitors} | Retornantes: ${returningVisitors}
- Formulários NÃO lidos: ${formsNaoLidas}
- Taxa visitante→formulário: ${taxaConversaoGeral}%
- Taxa visitante→clique: ${taxaCliquesGeral}%

════════════════════════════════════════
      COMPARATIVOS TEMPORAIS
════════════════════════════════════════

📊 ACESSOS:
- Hoje: ${acessosHoje} | Ontem: ${acessosOntem} | Var: ${pctChange(acessosHoje, acessosOntem)}
- Esta semana: ${acessosEstaSemana} | Semana passada: ${acessosSemanaPassada} | Var: ${pctChange(acessosEstaSemana, acessosSemanaPassada)}
- Últimos 7 dias: ${acessosUlt7}
- Últimos 30 dias: ${acessosUlt30} | 30 anteriores: ${acessos30a60} | Var: ${pctChange(acessosUlt30, acessos30a60)}

📋 FORMULÁRIOS:
- Hoje: ${formsHoje} | Ontem: ${formsOntem} | Var: ${pctChange(formsHoje, formsOntem)}
- Esta semana: ${formsEstaSemana} | Semana passada: ${formsSemanaPassada} | Var: ${pctChange(formsEstaSemana, formsSemanaPassada)}
- Últimos 30 dias: ${formsUlt30} | 30 anteriores: ${forms30a60} | Var: ${pctChange(formsUlt30, forms30a60)}

🔗 CLIQUES SOCIAIS:
- Hoje: ${cliquesHoje} | Ontem: ${cliquesOntem} | Var: ${pctChange(cliquesHoje, cliquesOntem)}
- Esta semana: ${cliquesEstaSemana} | Semana passada: ${cliquesSemanaPassada} | Var: ${pctChange(cliquesEstaSemana, cliquesSemanaPassada)}
- Últimos 30 dias: ${cliquesUlt30}

════════════════════════════════════════
      FUNIL DE ENGAJAMENTO
════════════════════════════════════════
👁️ Visitantes (${totalVisitantes}) → 🔗 Cliques (${totalCliques}) → 📋 Formulários (${totalFormularios})
Conv. visitante→clique: ${taxaCliquesGeral}% | Conv. visitante→form: ${taxaConversaoGeral}%

════════════════════════════════════════
    ANÁLISE CRUZADA POR ZONA ELEITORAL
    (acessos + cliques + formulários)
════════════════════════════════════════
${crossZonas}

════════════════════════════════════════
    ANÁLISE CRUZADA POR CIDADE
════════════════════════════════════════
${crossCidades}

════════════════════════════════════════
    ANÁLISE CRUZADA POR BAIRRO
════════════════════════════════════════
${crossBairros}

════════════════════════════════════════
    ANÁLISE CRUZADA POR REGIÃO DE PLANEJAMENTO
════════════════════════════════════════
${crossRegioes}

════════════════════════════════════════
         DISPOSITIVOS & TECNOLOGIA
════════════════════════════════════════
Dispositivos: ${topN(dispositivoStats)}
Mobile: ${mobileCount} | Desktop: ${desktopCount} | Tablet: ${tabletCount}
Navegadores: ${topN(navegadorStats)}
Sistemas: ${topN(soStats)}

════════════════════════════════════════
         GEOGRAFIA DETALHADA
════════════════════════════════════════
Países: ${topN(paisStats)}
Estados: ${topN(estadoStats)}
Cidades (acessos): ${topN(cidadeStats)}
Bairros (acessos): ${topN(bairroStats, 25)}
CEPs mais frequentes: ${topN(cepStats, 10)}
Zonas eleitorais (acessos): ${topN(zonaStats)}
Regiões de planejamento (acessos): ${topN(regiaoStats)}

════════════════════════════════════════
         PÁGINAS & NAVEGAÇÃO
════════════════════════════════════════
Páginas mais acessadas: ${topN(paginaStats)}

════════════════════════════════════════
         UTM & FONTES DE TRÁFEGO
════════════════════════════════════════
utm_source: ${topN(utmSourceStats) || "Nenhum UTM registrado"}
utm_medium: ${topN(utmMediumStats) || "—"}
utm_campaign: ${topN(utmCampaignStats) || "—"}
utm_content: ${topN(utmContentStats) || "—"}
utm_term: ${topN(utmTermStats) || "—"}
Referrers: ${topN(referrerStats) || "Tráfego direto"}

════════════════════════════════════════
     CLIQUES SOCIAIS — DETALHAMENTO
════════════════════════════════════════
Por tipo: ${topN(clickTypeStats)}
Por seção da página: ${topN(clickSectionStats)}
Por texto do botão: ${topN(clickBtnStats)}
Por zona eleitoral: ${topN(clickZonaStats)}
Por cidade: ${topN(clickCidadeStats)}
Por bairro: ${topN(clickBairroStats)}
Por região: ${topN(clickRegiaoStats)}
Por dispositivo: ${topN(clickDispStats)}

════════════════════════════════════════
     FORMULÁRIOS — DETALHAMENTO
════════════════════════════════════════
Por cidade: ${topN(formCidadeStats)}
Por zona eleitoral: ${topN(formZonaStats)}
Por bairro: ${topN(formBairroStats)}
Por região: ${topN(formRegiaoStats)}
Não lidos: ${formsNaoLidas}

════════════════════════════════════════
         MAPA DE CALOR — HORÁRIOS
════════════════════════════════════════
Distribuição completa (24h): ${fullHourly}
Top horários: ${peakHours || "Sem dados"}

════════════════════════════════════════
         DIAS DA SEMANA
════════════════════════════════════════
${Object.entries(dayDist).sort(([,a],[,b]) => b - a).map(([d,c]) => `${d}: ${c}`).join(", ") || "—"}

════════════════════════════════════════
     ÚLTIMOS 15 FORMULÁRIOS
════════════════════════════════════════
${JSON.stringify(recentForms || [], null, 1)}

════════════════════════════════════════
     ÚLTIMOS 10 CLIQUES
════════════════════════════════════════
${JSON.stringify(recentClicks || [], null, 1)}

════════════════════════════════════════
Módulo atual do usuário no painel: ${currentRoute || "Visão Geral"}
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
          maxOutputTokens: 6000,
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
