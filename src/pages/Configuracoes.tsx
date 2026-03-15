import { motion } from "framer-motion";
import { Database, Server, CheckCircle, Info } from "lucide-react";

const tables = [
  { nome: "acessos_site", descricao: "Registra cada visita ao site da campanha. Guarda informações como cidade, dispositivo, navegador e de onde o visitante veio (Instagram, WhatsApp, Google etc)." },
  { nome: "mensagens_contato", descricao: "Armazena os formulários de contato enviados pelos visitantes. Contém nome, telefone, mensagem e localização capturada silenciosamente." },
  { nome: "cliques_whatsapp", descricao: "Registra cada clique nos botões de WhatsApp e Instagram. Inclui localização, dispositivo e horário para análise de engajamento." },
  { nome: "albuns", descricao: "Gerencia os álbuns da galeria de fotos da campanha. Cada álbum tem nome, descrição e uma foto de capa." },
  { nome: "galeria_fotos", descricao: "Armazena as fotos individuais da galeria, organizadas por álbum. Cada foto tem título, legenda e pode ser marcada como visível ou oculta." },
  { nome: "configuracoes", descricao: "Configurações gerais do sistema como ativar/desativar a galeria. Chaves de configuração com valores editáveis." },
  { nome: "roles_usuarios", descricao: "Controla o nível de acesso dos administradores. Define quem é super admin, admin ou editor." },
];

export default function Configuracoes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Informações do sistema e conexão com banco de dados</p>
      </div>

      {/* Connection Status */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <Server className="h-5 w-5 text-success" />
          <h3 className="text-sm font-medium">Status da Conexão</h3>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-success/5 p-4">
          <CheckCircle className="h-6 w-6 text-success" />
          <div>
            <div className="text-sm font-medium text-success">Conectado ao Supabase</div>
            <div className="text-xs text-muted-foreground">Última sincronização: agora mesmo</div>
          </div>
        </div>
      </motion.div>

      {/* Supabase Details */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <Database className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-medium">Detalhes do Projeto Supabase</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">URL do Projeto</label>
            <div className="mt-1 rounded-lg bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-xs text-foreground/70 font-mono select-all">
              https://yvdfdmyusdhgtzfguxbj.supabase.co
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Chave Anônima (Pública)</label>
            <div className="mt-1 rounded-lg bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-xs text-foreground/70 font-mono truncate select-all">
              eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
            </div>
          </div>
        </div>
      </motion.div>

      {/* Table Documentation */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <Info className="h-5 w-5 text-secondary" />
          <h3 className="text-sm font-medium">Documentação das Tabelas</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Explicação em linguagem simples do que cada tabela do banco de dados armazena e como os dados fluem pelo sistema.
        </p>
        <div className="space-y-3">
          {tables.map((t, i) => (
            <motion.div
              key={t.nome}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="rounded-lg bg-white/[0.03] p-4"
            >
              <h4 className="text-xs font-medium text-primary font-mono">{t.nome}</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{t.descricao}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Data Flow */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
        <h3 className="text-sm font-medium mb-3">Como os Dados Fluem</h3>
        <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
          <p>1. <strong className="text-foreground/80">Visitante acessa o site</strong> → Dados de dispositivo, localização e navegador são registrados na tabela <span className="text-primary font-mono">acessos_site</span>.</p>
          <p>2. <strong className="text-foreground/80">Visitante preenche formulário</strong> → Dados pessoais + localização GPS são salvos em <span className="text-primary font-mono">mensagens_contato</span>.</p>
          <p>3. <strong className="text-foreground/80">Visitante clica em WhatsApp/Instagram</strong> → O clique é registrado em <span className="text-primary font-mono">cliques_whatsapp</span> com localização e horário.</p>
          <p>4. <strong className="text-foreground/80">Este painel lê tudo</strong> → Processa os dados das 3 tabelas acima e apresenta em gráficos, mapas e rankings para a equipe de campanha.</p>
        </div>
      </motion.div>
    </div>
  );
}
