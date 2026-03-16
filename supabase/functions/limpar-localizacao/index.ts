import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type LocationRow = {
  id: string;
  endereco_ip?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  cidade?: string | null;
  estado?: string | null;
  bairro?: string | null;
  cep?: string | null;
  rua?: string | null;
  endereco_completo?: string | null;
  zona_eleitoral?: string | null;
  regiao_planejamento?: string | null;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function hasText(value?: string | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasNumber(value?: number | null): boolean {
  return typeof value === "number" && Number.isFinite(value);
}

function hasUsableLocation(row: LocationRow): boolean {
  const hasCoordinates = hasNumber(row.latitude) && hasNumber(row.longitude);

  return (
    hasText(row.endereco_ip) ||
    hasCoordinates ||
    hasText(row.cidade) ||
    hasText(row.estado) ||
    hasText(row.bairro) ||
    hasText(row.cep) ||
    hasText(row.rua) ||
    hasText(row.endereco_completo) ||
    hasText(row.zona_eleitoral) ||
    hasText(row.regiao_planejamento)
  );
}

async function collectInvalidIds(
  supabaseAdmin: ReturnType<typeof createClient>,
  table: "acessos_site" | "mensagens_contato" | "cliques_whatsapp",
) {
  const invalidIds: string[] = [];
  const batchSize = 1000;
  let from = 0;

  for (;;) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select("id, endereco_ip, latitude, longitude, cidade, estado, bairro, cep, rua, endereco_completo, zona_eleitoral, regiao_planejamento, criado_em")
      .order("criado_em", { ascending: true })
      .range(from, from + batchSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    invalidIds.push(
      ...data
        .filter((row) => !hasUsableLocation(row))
        .map((row) => row.id),
    );

    if (data.length < batchSize) break;
    from += batchSize;
  }

  return invalidIds;
}

async function deleteInChunks(
  supabaseAdmin: ReturnType<typeof createClient>,
  table: "acessos_site" | "mensagens_contato" | "cliques_whatsapp",
  ids: string[],
) {
  const chunkSize = 500;

  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const { error } = await supabaseAdmin.from(table).delete().in("id", chunk);
    if (error) throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Configuração do servidor incompleta" }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Não autorizado" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user: caller },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !caller) {
      return jsonResponse({ error: "Token inválido ou expirado" }, 401);
    }

    const { data: isAdmin } = await supabaseAdmin.rpc("eh_admin", { _user_id: caller.id });
    if (!isAdmin) {
      return jsonResponse({ error: "Apenas admins podem limpar registros" }, 403);
    }

    const tables = ["acessos_site", "mensagens_contato", "cliques_whatsapp"] as const;
    const summary: Record<string, number> = {};

    for (const table of tables) {
      const invalidIds = await collectInvalidIds(supabaseAdmin, table);
      if (invalidIds.length > 0) {
        await deleteInChunks(supabaseAdmin, table, invalidIds);
      }
      summary[table] = invalidIds.length;
    }

    return jsonResponse({
      success: true,
      removed: summary,
      total_removido: Object.values(summary).reduce((acc, value) => acc + value, 0),
    });
  } catch (err) {
    console.error("limpar-localizacao unexpected error:", err);
    return jsonResponse({ error: err instanceof Error ? err.message : "Erro interno do servidor" }, 500);
  }
});
