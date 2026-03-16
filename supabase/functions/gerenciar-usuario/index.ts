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
      return jsonResponse({ error: "Token inválido ou expirado" }, 401);
    }

    const { data: isAdmin } = await supabaseAdmin.rpc("eh_admin", { _user_id: caller.id });
    if (!isAdmin) {
      return jsonResponse({ error: "Apenas admins podem gerenciar usuários" }, 403);
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Body JSON inválido" }, 400);
    }

    const { action, user_id, new_password, new_username } = body;

    // ─── DELETE USER ───
    if (action === "delete") {
      if (!user_id) return jsonResponse({ error: "user_id é obrigatório" }, 400);
      if (user_id === caller.id) return jsonResponse({ error: "Você não pode excluir sua própria conta" }, 400);

      await supabaseAdmin.from("roles_usuarios").delete().eq("user_id", user_id);

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
      if (deleteError) {
        console.error("Delete error:", deleteError.message);
        return jsonResponse({ error: deleteError.message }, 400);
      }

      console.log(`User deleted: ${user_id} by ${caller.id}`);
      return jsonResponse({ success: true, message: "Usuário excluído com sucesso" });
    }

    // ─── RESET PASSWORD ───
    if (action === "reset_password") {
      if (!user_id || !new_password) return jsonResponse({ error: "user_id e new_password são obrigatórios" }, 400);
      if (String(new_password).length < 6) return jsonResponse({ error: "Senha deve ter no mínimo 6 caracteres" }, 400);

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
        password: String(new_password),
      });

      if (updateError) {
        console.error("Reset password error:", updateError.message);
        return jsonResponse({ error: updateError.message }, 400);
      }

      console.log(`Password reset for ${user_id} by ${caller.id}`);
      return jsonResponse({ success: true, message: "Senha redefinida com sucesso" });
    }

    // ─── RENAME USER ───
    if (action === "rename") {
      if (!user_id || !new_username) return jsonResponse({ error: "user_id e new_username são obrigatórios" }, 400);

      const trimmed = String(new_username).trim().toLowerCase().replace(/\s+/g, ".");
      if (!trimmed) return jsonResponse({ error: "Nome de usuário não pode ser vazio" }, 400);

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
        user_metadata: { username: trimmed },
      });

      if (updateError) {
        console.error("Rename error:", updateError.message);
        return jsonResponse({ error: updateError.message }, 400);
      }

      console.log(`User renamed to ${trimmed}: ${user_id} by ${caller.id}`);
      return jsonResponse({ success: true, message: `Nome atualizado para "${trimmed}"` });
    }

    return jsonResponse({ error: "Ação inválida. Use 'delete', 'reset_password' ou 'rename'" }, 400);
  } catch (err) {
    console.error("gerenciar-usuario unexpected error:", err);
    return jsonResponse({ error: err.message || "Erro interno do servidor" }, 500);
  }
});
