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
    let body: any;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Body JSON inválido" }, 400);
    }

    const { username, password } = body;
    const normalizedUsername = String(username || "").trim().toLowerCase().replace(/\s+/g, ".");

    if (!normalizedUsername) {
      return jsonResponse({ error: "Nome de usuário é obrigatório" }, 400);
    }

    if (!password || String(password).length < 6) {
      return jsonResponse({ error: "Senha deve ter no mínimo 6 caracteres" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return jsonResponse({ error: "Configuração do servidor incompleta" }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Check if there are existing painel admins
    const { count } = await supabaseAdmin
      .from("roles_painel")
      .select("*", { count: "exact", head: true });

    const isFirstUser = count === null || count === 0;

    if (!isFirstUser) {
      // Verify caller is authenticated admin
      const authHeader = req.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
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
        return jsonResponse({ error: "Apenas admins podem criar usuários" }, 403);
      }
    }

    const email = `${normalizedUsername}@chamarosa.app`;

    // Check if user already exists
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("listUsers error:", listError.message);
      return jsonResponse({ error: "Erro ao verificar usuários existentes" }, 500);
    }

    const existing = listData?.users?.find((u: any) => u.email === email);
    if (existing) {
      return jsonResponse({ error: `Usuário "${normalizedUsername}" já existe` }, 400);
    }

    // Create user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: String(password),
      email_confirm: true,
      user_metadata: { username: normalizedUsername },
    });

    if (createError) {
      console.error("createUser error:", createError.message);
      return jsonResponse({ error: createError.message }, 400);
    }

    if (!newUser?.user) {
      return jsonResponse({ error: "Erro inesperado: usuário não foi criado" }, 500);
    }

    // Assign role in roles_painel
    const { error: roleError } = await supabaseAdmin
      .from("roles_painel")
      .insert({ user_id: newUser.user.id, cargo: isFirstUser ? "super_admin" : "admin" });

    if (roleError) {
      console.error("Role insert error:", roleError.message);
    }

    console.log(`User created: ${normalizedUsername} (${newUser.user.id})`);

    return jsonResponse({
      success: true,
      message: `Usuário "${normalizedUsername}" criado com sucesso`,
      login: { username: normalizedUsername, email },
    });
  } catch (err) {
    console.error("criar-usuario unexpected error:", err);
    return jsonResponse({ error: err.message || "Erro interno do servidor" }, 500);
  }
});
