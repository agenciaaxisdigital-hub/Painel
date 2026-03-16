import { useState } from "react";
import { motion } from "framer-motion";
import { Database, Server, CheckCircle, AlertTriangle, Info, RefreshCw, Trash2, Loader2 } from "lucide-react";
import { useConnectionStatus } from "@/hooks/use-supabase-data";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import UserManagement from "@/components/settings/UserManagement";

const tables = [
  { nome: "acessos_site", descricao: "Registra cada visita ao Site Principal. Guarda cidade, dispositivo, navegador, origem (UTM, referrer) e cookies de visitante." },
  { nome: "mensagens_contato", descricao: "Armazena os formulários de contato enviados. Contém nome, telefone, mensagem, email e coordenadas GPS capturadas." },
  { nome: "cliques_whatsapp", descricao: "Registra cada clique nos botões de WhatsApp, Instagram e Facebook. Inclui tipo_clique, seção da página, texto do botão e localização." },
  { nome: "roles_usuarios", descricao: "Controla o nível de acesso dos administradores do painel. Super admin, admin ou editor." },
  { nome: "configuracoes", descricao: "Configurações gerais do sistema. Chaves de configuração com valores editáveis." },
];

const utmInstructions = [
  { param: "utm_source", example: "instagram", desc: "Origem do tráfego (instagram, whatsapp, google, facebook)" },
  { param: "utm_medium", example: "social", desc: "Meio de comunicação (social, cpc, email, banner)" },
  { param: "utm_campaign", example: "lancamento_2026", desc: "Nome da campanha específica" },
  { param: "utm_content", example: "video_propostas", desc: "Variação do conteúdo (A/B test)" },
  { param: "utm_term", example: "saude_mulher", desc: "Palavra-chave (em anúncios pagos)" },
];

export default function Configuracoes() {
  const connection = useConnectionStatus();
  const [cleaning, setCleaning] = useState(false);

  const handleCleanup = async () => {
    setCleaning(true);
    try {
      const { data, error } = await supabase.functions.invoke("limpar-localizacao", { method: "POST" });
      if (error) throw error;
      toast({ title: "Limpeza concluída", description: `${data.total_removido || 0} registros sem localização removidos.` });
    } catch (err: any) {
      toast({ title: "Erro na limpeza", description: err.message, variant: "destructive" });
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Status do sistema e gerenciamento de usuários</p>
      </div>

      <Tabs defaultValue="sistema" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="sistema">Sistema</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios">
          <UserManagement />
        </TabsContent>

        <TabsContent value="sistema" className="space-y-6">

      {/* Connection Status */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <Server className="h-5 w-5 text-success" />
          <h3 className="text-sm font-medium">Status da Conexão Supabase</h3>
        </div>
        {connection.isLoading ? <Skeleton className="h-16" /> : connection.data ? (
          <div className={`flex items-center gap-3 rounded-lg p-4 ${connection.data.status === "green" ? "bg-success/5" : "bg-secondary/5"}`}>
            {connection.data.status === "green" ? <CheckCircle className="h-6 w-6 text-success" /> : <AlertTriangle className="h-6 w-6 text-secondary" />}
            <div>
              <div className={`text-sm font-medium ${connection.data.status === "green" ? "text-success" : "text-secondary"}`}>
                {connection.data.status === "green" ? "Conectado e recebendo dados" : "Aguardando novos dados"}
              </div>
              <div className="text-xs text-muted-foreground">
                {connection.data.lastRecord
                  ? `Último registro: ${formatDistanceToNow(new Date(connection.data.lastRecord), { addSuffix: true, locale: ptBR })}`
                  : "Nenhum registro encontrado ainda"
                }
              </div>
            </div>
          </div>
        ) : null}
      </motion.div>

      {/* Record Counts */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <Database className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-medium">Registros por Tabela</h3>
        </div>
        {connection.isLoading ? <Skeleton className="h-20" /> : connection.data ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(connection.data.counts).map(([key, val]) => (
                <div key={key} className="rounded-lg bg-white/[0.03] p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{val.toLocaleString("pt-BR")}</div>
                  <div className="text-xs text-muted-foreground mt-1">{key}</div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={handleCleanup} disabled={cleaning} className="gap-2">
              {cleaning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              {cleaning ? "Limpando..." : "Remover registros sem localização"}
            </Button>
          </div>
        ) : null}
      </motion.div>

      {/* Environment */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
        <h3 className="text-sm font-medium mb-3">Variáveis de Ambiente</h3>
        <div className="space-y-2">
          {[
            { key: "VITE_SUPABASE_URL", value: "https://yvdfdmyusdhgtzfguxbj.supabase.co" },
            { key: "VITE_SUPABASE_PUBLISHABLE_KEY", value: "eyJhbG...••••" },
            { key: "VITE_SUPABASE_PROJECT_ID", value: "yvdfdmyusdhgtzfguxbj" },
          ].map((env) => (
            <div key={env.key} className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2">
              <span className="text-xs font-mono text-primary">{env.key}</span>
              <span className="text-xs text-muted-foreground font-mono truncate">{env.value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Table Documentation */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <Info className="h-5 w-5 text-secondary" />
          <h3 className="text-sm font-medium">Documentação das Tabelas</h3>
        </div>
        <div className="space-y-3">
          {tables.map((t, i) => (
            <motion.div key={t.nome} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
              className="rounded-lg bg-white/[0.03] p-4">
              <h4 className="text-xs font-medium text-primary font-mono">{t.nome}</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{t.descricao}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* UTM Campaign Setup */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
        <h3 className="text-sm font-medium mb-3">Como Configurar UTM para Campanhas</h3>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          Adicione parâmetros UTM aos links da campanha para rastrear a origem de cada visitante no painel. 
          Exemplo: <code className="text-primary">https://seusite.com/?utm_source=instagram&utm_medium=social&utm_campaign=lancamento</code>
        </p>
        <div className="space-y-2">
          {utmInstructions.map((u) => (
            <div key={u.param} className="flex items-start gap-3 rounded-lg bg-white/[0.03] px-3 py-2">
              <code className="text-xs text-primary font-mono shrink-0">{u.param}</code>
              <div>
                <div className="text-xs text-foreground/80">{u.desc}</div>
                <div className="text-[10px] text-muted-foreground">Ex: {u.example}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Data Flow */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
        <h3 className="text-sm font-medium mb-3">Fluxo de Dados</h3>
        <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
          <p>1. <strong className="text-foreground/80">Visitante acessa o site</strong> → Dados salvos em <code className="text-primary font-mono">acessos_site</code></p>
          <p>2. <strong className="text-foreground/80">Visitante preenche formulário</strong> → Dados + GPS salvos em <code className="text-primary font-mono">mensagens_contato</code></p>
          <p>3. <strong className="text-foreground/80">Visitante clica em botão social</strong> → Clique registrado em <code className="text-primary font-mono">cliques_whatsapp</code></p>
          <p>4. <strong className="text-foreground/80">Este painel lê tudo</strong> → Apresenta em gráficos, tabelas e rankings para a equipe de campanha.</p>
        </div>
      </motion.div>

        </TabsContent>
      </Tabs>
    </div>
  );
}
