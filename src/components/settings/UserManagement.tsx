import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Users, Plus, Shield, Loader2, Trash2, KeyRound, MoreVertical, CheckCircle, Pencil, AlertTriangle, RefreshCw } from "lucide-react";
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

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ".");
}

async function callAdminFunction<T>(functionName: string, body: unknown = {}): Promise<T> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`;
    console.log(`[UserManagement] Calling ${functionName}...`, { url, body });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    console.log(`[UserManagement] ${functionName} response:`, response.status, text);

    let payload: any;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }

    if (!response.ok) {
      const errorMsg = payload?.error || payload?.message || `Erro ${response.status}`;
      throw new Error(errorMsg);
    }

    return payload as T;
  } catch (err: any) {
    console.error(`[UserManagement] ${functionName} error:`, err);
    throw err;
  }
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

  // Rename dialog
  const [renameTarget, setRenameTarget] = useState<UserData | null>(null);
  const [newUsername, setNewUsername] = useState("");

  const { data: users, isLoading, error: usersError, refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const data = await callAdminFunction<{ users: UserData[] }>("listar-usuarios");
      return data.users || [];
    },
    enabled: !!user,
    retry: 1,
    staleTime: 30_000,
  });

  const createUser = useMutation({
    mutationFn: async () => {
      return callAdminFunction<{ message: string }>("criar-usuario", {
        username: normalizeUsername(username),
        password,
      });
    },
    onSuccess: (data) => {
      toast.success(data.message || "Usuário criado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setOpen(false);
      setUsername("");
      setPassword("");
    },
    onError: (err: Error) => {
      console.error("[UserManagement] Create user error:", err);
      toast.error(err.message || "Erro ao criar usuário");
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      return callAdminFunction<{ message: string }>("gerenciar-usuario", {
        action: "delete",
        user_id: userId,
      });
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
      return callAdminFunction<{ message: string }>("gerenciar-usuario", {
        action: "reset_password",
        user_id: userId,
        new_password: password,
      });
    },
    onSuccess: (data) => {
      toast.success(data.message || "Senha redefinida com sucesso");
      setResetTarget(null);
      setNewPassword("");
    },
    onError: (err: Error) => toast.error(err.message || "Erro ao redefinir senha"),
  });

  const renameUser = useMutation({
    mutationFn: async ({ userId, newName }: { userId: string; newName: string }) => {
      return callAdminFunction<{ message: string }>("gerenciar-usuario", {
        action: "rename",
        user_id: userId,
        new_username: normalizeUsername(newName),
      });
    },
    onSuccess: (data) => {
      toast.success(data.message || "Usuário renomeado");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setRenameTarget(null);
      setNewUsername("");
    },
    onError: (err: Error) => toast.error(err.message || "Erro ao renomear"),
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

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget) return;
    if (!newUsername.trim()) return toast.error("Nome não pode ser vazio");
    renameUser.mutate({ userId: renameTarget.user_id, newName: newUsername });
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-medium">Usuários do Sistema</h3>
            {users && users.length > 0 && (
              <Badge variant="outline" className="text-[10px]">{users.length} usuário{users.length !== 1 ? "s" : ""}</Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => refetch()} className="gap-1 text-xs">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>

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
                      Login será: <span className="font-mono text-primary">{normalizeUsername(username) || "..."}</span>
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
        </div>

        {/* Error state */}
        {usersError && (
          <div className="flex items-center gap-3 rounded-lg bg-destructive/10 border border-destructive/20 p-4 mb-4">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-destructive">Erro ao carregar usuários</p>
              <p className="text-xs text-muted-foreground mt-0.5">{(usersError as Error).message}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => refetch()} className="shrink-0">
              Tentar novamente
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...
          </div>
        ) : !users?.length && !usersError ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <p>Nenhum usuário encontrado</p>
            <p className="text-xs mt-1">Clique em "Novo Usuário" para criar o primeiro.</p>
          </div>
        ) : users && users.length > 0 ? (
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
                            <DropdownMenuItem onClick={() => { setRenameTarget(u); setNewUsername(u.username); }}
                              className="gap-2 text-xs">
                              <Pencil className="h-3.5 w-3.5" /> Editar Nome
                            </DropdownMenuItem>
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
        ) : null}
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

      {/* Rename User Dialog */}
      <Dialog open={!!renameTarget} onOpenChange={(o) => { if (!o) { setRenameTarget(null); setNewUsername(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Nome de Usuário</DialogTitle>
            <DialogDescription>
              Altere o nome de <strong>{renameTarget?.username}</strong>. O login será atualizado automaticamente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenameSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="new-username">Novo Nome</Label>
              <Input id="new-username" placeholder="Ex: joao.silva"
                value={newUsername} onChange={(e) => setNewUsername(e.target.value)} autoComplete="off" />
              <p className="text-[11px] text-muted-foreground">
                Login será: <span className="font-mono text-primary">{normalizeUsername(newUsername) || "..."}</span>
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setRenameTarget(null); setNewUsername(""); }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={renameUser.isPending}>
                {renameUser.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
