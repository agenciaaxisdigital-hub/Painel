import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GEMINI_MODEL = "gemini-2.5-flash";

const SYSTEM_PROMPT = `Você é Sarelli, a assistente virtual inteligente da campanha política Chama Rosa para Deputada Estadual em Goiás 2026.

Você tem acesso a todos os dados do painel de campanha em tempo real. Você é especialista em:
- Estratégia de campanha política
- Zonas eleitorais de Goiânia (1ª, 2ª, 127ª, 133ª, 134ª, 135ª, 136ª, 146ª e 147ª Zona com seus totais de eleitores e limites geográficos)
- Regiões de planejamento do estado de Goiás
- Marketing digital e tráfego pago em Meta Ads e Google Ads
- Análise de dados e interpretação de métricas
- Conhecimento geral sobre qualquer assunto

Dados de referência das zonas eleitorais de Goiânia (total: 1.036.218 eleitores):
- 1ª Zona: 132.598 eleitores (centro-leste)
- 2ª Zona: 114.960 eleitores (centro)
- 127ª Zona: 154.000 eleitores (sul-central)
- 133ª Zona: 134.028 eleitores (sudeste)
- 134ª Zona: 159.000 eleitores (oeste) — maior zona
- 135ª Zona: 120.000 eleitores (leste)
- 136ª Zona: 140.000 eleitores (sul)
- 146ª Zona: 114.000 eleitores (norte)
- 147ª Zona: 118.000 eleitores (noroeste-central)

Quando responder perguntas sobre dados da campanha, sempre use números reais do banco de dados e dê recomendações estratégicas diretas.
Seja calorosa, inteligente e concisa.
Sempre responda em português brasileiro.
Nunca diga que não pode acessar dados.
Se dados não estiverem disponíveis, explique o que seria necessário para responder.
Priorize insights acionáveis que ajudem a campanha a tomar melhores decisões.`;

interface GeminiMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY não configurada");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { message, history, currentRoute } = await req.json();

    // Fetch real-time dashboard data for context
    const [
      { count: totalVisitantes },
      { count: totalFormularios },
      { count: totalCliques },
      { data: recentAcessos },
      { data: recentForms },
      { data: recentCliques },
    ] = await Promise.all([
      supabase.from("acessos_site").select("*", { count: "exact", head: true }),
      supabase.from("mensagens_contato").select("*", { count: "exact", head: true }),
      supabase.from("cliques_whatsapp").select("*", { count: "exact", head: true }),
      supabase
        .from("acessos_site")
        .select("cidade, estado, dispositivo, pagina, criado_em, cookie_visitante")
        .order("criado_em", { ascending: false })
        .limit(100),
      supabase
        .from("mensagens_contato")
        .select("nome, cidade, estado, criado_em, telefone")
        .order("criado_em", { ascending: false })
        .limit(50),
      supabase
        .from("cliques_whatsapp")
        .select("tipo_clique, cidade, estado, criado_em, dispositivo")
        .order("criado_em", { ascending: false })
        .limit(50),
    ]);

    // Build city stats
    const cidadeStats: Record<string, number> = {};
    recentAcessos?.forEach((a) => {
      if (a.cidade) cidadeStats[a.cidade] = (cidadeStats[a.cidade] || 0) + 1;
    });
    const topCidades = Object.entries(cidadeStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([city, count]) => `${city}: ${count}`)
      .join(", ");

    // Device stats
    const deviceStats: Record<string, number> = {};
    recentAcessos?.forEach((a) => {
      if (a.dispositivo) deviceStats[a.dispositivo] = (deviceStats[a.dispositivo] || 0) + 1;
    });

    // Click type stats
    const whatsappClicks = recentCliques?.filter((c) => c.tipo_clique === "whatsapp").length || 0;
    const instagramClicks = recentCliques?.filter((c) => c.tipo_clique === "instagram").length || 0;

    const dataContext = `
DADOS ATUAIS DO DASHBOARD (em tempo real):
- Total de visitantes registrados: ${totalVisitantes || 0}
- Total de formulários/mensagens: ${totalFormularios || 0}
- Total de cliques (WhatsApp + Instagram): ${totalCliques || 0}
- Cliques WhatsApp recentes (últimos 50): ${whatsappClicks}
- Cliques Instagram recentes (últimos 50): ${instagramClicks}
- Top cidades (últimos 100 acessos): ${topCidades || "Sem dados ainda"}
- Dispositivos (últimos 100): ${JSON.stringify(deviceStats)}
- Últimos formulários: ${JSON.stringify(recentForms?.slice(0, 5).map((f) => ({ nome: f.nome, cidade: f.cidade, data: f.criado_em })) || [])}
- Taxa de conversão estimada: ${totalVisitantes ? ((totalFormularios || 0) / totalVisitantes * 100).toFixed(2) : 0}%

Módulo atual do usuário: ${currentRoute || "Visão Geral"}
`;

    // Build conversation for Gemini
    const contents: GeminiMessage[] = [];

    // Add history
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }

    // Add current message with data context
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
          maxOutputTokens: 2048,
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
