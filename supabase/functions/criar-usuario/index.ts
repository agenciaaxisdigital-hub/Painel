import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password, cargo, setup_key } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: "Username e senha são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SETUP_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Checar se já existem admins
    const { count, error: countError } = await supabaseAdmin
      .from("roles_usuarios")
      .select("*", { count: "exact", head: true });

    console.log("Count result:", count, "Error:", countError);
    const isFirstUser = count === null || count === 0;

    if (!isFirstUser && setup_key !== SETUP_KEY) {
      // Verificar auth do chamador
      const authHeader = req.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ error: "Não autorizado - admin necessário" }),
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

    // Criar usuário no Auth
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

    // Atribuir cargo
    const role = isFirstUser ? "super_admin" : (cargo || "editor");
    const { error: roleError } = await supabaseAdmin
      .from("roles_usuarios")
      .insert({ user_id: newUser.user.id, cargo: role });

    if (roleError) {
      return new Response(
        JSON.stringify({ error: roleError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Usuário "${username}" criado com cargo "${role}"`,
        login: { username, email },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
