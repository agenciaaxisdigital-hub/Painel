import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();
    const normalizedUsername = String(username || "").trim().toLowerCase().replace(/\s+/g, ".");

    if (!normalizedUsername || !password) {
      return new Response(
        JSON.stringify({ error: "Nome de usuário e senha são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Senha deve ter no mínimo 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if there are existing admins
    const { count } = await supabaseAdmin
      .from("roles_usuarios")
      .select("*", { count: "exact", head: true });

    const isFirstUser = count === null || count === 0;

    if (!isFirstUser) {
      // Verify caller is authenticated admin
      const authHeader = req.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ error: "Não autorizado" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const token = authHeader.replace("Bearer ", "");
      const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token);

      if (!caller) {
        return new Response(
          JSON.stringify({ error: "Token inválido" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: isAdmin } = await supabaseAdmin.rpc("eh_admin", { _user_id: caller.id });
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: "Apenas admins podem criar usuários" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const email = `${username.toLowerCase().replace(/\s+/g, ".")}@chamarosa.app`;

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(u => u.email === email);
    if (existing) {
      return new Response(
        JSON.stringify({ error: `Usuário "${username}" já existe` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    });

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // All users get admin role (no hierarchy)
    const { error: roleError } = await supabaseAdmin
      .from("roles_usuarios")
      .insert({ user_id: newUser.user.id, cargo: "admin" });

    if (roleError) {
      console.error("Role insert error:", roleError);
      // Still return success since user was created
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Usuário "${username}" criado com sucesso`,
        login: { username, email },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("criar-usuario error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
