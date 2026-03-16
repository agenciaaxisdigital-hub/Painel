import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Users, Plus, Shield, Loader2, Trash2, KeyRound, MoreVertical, CheckCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type UserData = {
  user_id: string;
  cargo: string;
  criado_em: string;
  username: string;
  email: string;
};

async function getToken() {
  const { data: session } = await supabase.auth.getSession();
  return session?.session?.access_token;
}

export default function UserManagement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null);

  // Reset password dialog
  const [resetTarget, setResetTarget] = useState<UserData | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Não autenticado");

      const { data, error } = await supabase.functions.invoke("listar-usuarios", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (error) throw error;
      return (data as { users: UserData[] }).users;
    },
  });

  const createUser = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Não autenticado");

      const { data, error } = await supabase.functions.invoke("criar-usuario", {
        body: { username, password },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (error) {
        // Try to extract the actual error message from the response
        try {
          const errorBody = JSON.parse(error.message);
          throw new Error(errorBody.error || error.message);
        } catch (parseErr) {
          // If the error context has a json body
          if (error.context && typeof error.context.json === 'function') {
            const body = await error.context.json();
            throw new Error(body?.error || error.message);
          }
          throw new Error(data?.error || error.message);
        }
      }
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Usuário criado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setOpen(false);
      setUsername("");
      setPassword("");
    },
    onError: (err: Error) => toast.error(err.message || "Erro ao criar usuário"),
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Não autenticado");

      const { data, error } = await supabase.functions.invoke("gerenciar-usuario", {
        body: { action: "delete", user_id: userId },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (error) {
        try {
          const errorBody = JSON.parse(error.message);
          throw new Error(errorBody.error || error.message);
        } catch (parseErr) {
          if (error.context && typeof error.context.json === 'function') {
            const body = await error.context.json();
            throw new Error(body?.error || error.message);
          }
          throw new Error(data?.error || error.message);
        }
      }
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Usuário excluído");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message || "Erro ao excluir"),
  });

  const resetPassword = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const token = await getToken();
      if (!token) throw new Error("Não autenticado");

      const { data, error } = await supabase.functions.invoke("gerenciar-usuario", {
        body: { action: "reset_password", user_id: userId, new_password: password },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (error) {
        try {
          const errorBody = JSON.parse(error.message);
          throw new Error(errorBody.error || error.message);
        } catch (parseErr) {
          if (error.context && typeof error.context.json === 'function') {
            const body = await error.context.json();
            throw new Error(body?.error || error.message);
          }
          throw new Error(data?.error || error.message);
        }
      }
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Senha redefinida");
      setResetTarget(null);
      setNewPassword("");
    },
    onError: (err: Error) => toast.error(err.message || "Erro ao redefinir senha"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return toast.error("Nome é obrigatório");
    if (password.length < 6) return toast.error("Senha deve ter no mínimo 6 caracteres");
    createUser.mutate();
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    if (newPassword.length < 6) return toast.error("Senha deve ter no mínimo 6 caracteres");
    resetPassword.mutate({ userId: resetTarget.user_id, password: newPassword });
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-medium">Usuários do Sistema</h3>
            {users && (
              <Badge variant="outline" className="text-[10px]">{users.length} usuário{users.length !== 1 ? "s" : ""}</Badge>
            )}
          </div>

          {/* Create User Dialog */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>O usuário poderá acessar o painel com o nome de usuário e senha definidos.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="username">Nome de usuário</Label>
                  <Input id="username" placeholder="Ex: joao.silva" value={username}
                    onChange={(e) => setUsername(e.target.value)} autoComplete="off" />
                  <p className="text-[11px] text-muted-foreground">
                    Login será: <span className="font-mono text-primary">{username.toLowerCase().replace(/\s+/g, ".") || "..."}</span>
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" placeholder="Mínimo 6 caracteres" value={password}
                    onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                  <Button type="submit" disabled={createUser.isPending}>
                    {createUser.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Criar Usuário
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...
          </div>
        ) : !users?.length ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Nenhum usuário encontrado</div>
        ) : (
          <div className="rounded-lg border border-white/[0.06] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead className="hidden sm:table-cell">Criado em</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="w-[60px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const isSelf = u.user_id === user?.id;
                  return (
                    <TableRow key={u.user_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm flex items-center gap-1.5">
                            {u.username}
                            {isSelf && <span className="text-[9px] text-primary">(você)</span>}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono">{u.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                        {new Date(u.criado_em).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1.5 text-[11px] text-success">
                          <CheckCircle className="h-3 w-3" /> Ativo
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setResetTarget(u); setNewPassword(""); }}
                              className="gap-2 text-xs">
                              <KeyRound className="h-3.5 w-3.5" /> Redefinir Senha
                            </DropdownMenuItem>
                            {!isSelf && (
                              <DropdownMenuItem onClick={() => setDeleteTarget(u)}
                                className="gap-2 text-xs text-destructive focus:text-destructive">
                                <Trash2 className="h-3.5 w-3.5" /> Excluir Usuário
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{deleteTarget?.username}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" disabled={deleteUser.isPending}
              onClick={() => deleteTarget && deleteUser.mutate(deleteTarget.user_id)}>
              {deleteUser.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetTarget} onOpenChange={(o) => { if (!o) { setResetTarget(null); setNewPassword(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para <strong>{resetTarget?.username}</strong>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input id="new-password" type="password" placeholder="Mínimo 6 caracteres"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setResetTarget(null); setNewPassword(""); }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={resetPassword.isPending}>
                {resetPassword.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Redefinir Senha
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}