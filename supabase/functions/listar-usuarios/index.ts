import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing env vars");
      return jsonResponse({ error: "Configuração do servidor incompleta" }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Não autorizado" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !caller) {
      console.error("Auth error:", authError?.message);
      return jsonResponse({ error: "Token inválido ou expirado" }, 401);
    }

    const { data: isAdmin } = await supabaseAdmin.rpc("eh_admin_painel", { _user_id: caller.id });
    if (!isAdmin) {
      return jsonResponse({ error: "Apenas admins podem listar usuários" }, 403);
    }

    // Get roles from roles_painel only
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("roles_painel")
      .select("user_id, cargo, criado_em");

    if (rolesError) {
      console.error("Roles query error:", rolesError.message);
      return jsonResponse({ error: rolesError.message }, 500);
    }

    // Get auth users metadata
    const { data: listData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
      console.error("listUsers error:", usersError.message);
      return jsonResponse({ error: usersError.message }, 500);
    }

    const usersMap = new Map((listData?.users || []).map((u: any) => [u.id, u]));

    const result = (roles || []).map((r: any) => {
      const authUser = usersMap.get(r.user_id) as any;
      return {
        user_id: r.user_id,
        cargo: r.cargo,
        criado_em: r.criado_em,
        username: authUser?.user_metadata?.username || authUser?.email?.split("@")[0] || "—",
        email: authUser?.email || "—",
      };
    });

    console.log(`Listed ${result.length} users for caller ${caller.id}`);

    return jsonResponse({ users: result });
  } catch (err) {
    console.error("listar-usuarios unexpected error:", err);
    return jsonResponse({ error: err.message || "Erro interno do servidor" }, 500);
  }
});
