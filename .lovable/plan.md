

## Plano: Aba de Gerenciamento de Usuários

### O que será feito

Adicionar uma aba "Usuários" na página de Configurações que permite:
1. **Listar todos os usuários** do sistema (buscando de `roles_usuarios` + metadata do auth)
2. **Criar novo usuário** com apenas **nome** (username) e **senha**, usando a edge function `criar-usuario` já existente
3. Escolher o **cargo** (super_admin, admin, editor)

### Como funciona

- A edge function `criar-usuario` já existe e faz tudo: cria o usuário no Supabase Auth com email fictício (`nome@chamarosa.app`), atribui cargo na tabela `roles_usuarios`, e valida que o chamador é admin.
- Só precisamos criar a **interface no frontend**.

### Implementação

**1. Nova página `src/pages/Configuracoes.tsx`** — Adicionar sistema de abas (Tabs):
- **Aba "Sistema"** — conteúdo atual (status, tabelas, UTM, etc.)
- **Aba "Usuários"** — novo componente com:
  - Lista de usuários existentes (query em `roles_usuarios`)
  - Botão "Novo Usuário" que abre um dialog
  - Formulário simples: campo Nome, campo Senha, select de Cargo
  - Chama `supabase.functions.invoke('criar-usuario', { body: { username, password, cargo } })` ao salvar

**2. Novo componente `src/components/settings/UserManagement.tsx`**:
- Busca usuários de `roles_usuarios` 
- Exibe tabela com nome (do user_metadata via uma edge function ou exibindo o user_id simplificado) e cargo
- Dialog de criação com validação básica (nome obrigatório, senha mínima 6 chars)

### Limitação conhecida
- A tabela `roles_usuarios` só tem `user_id` e `cargo` — não tem o username diretamente. Para listar nomes, criaremos uma edge function auxiliar que usa o service role para buscar `auth.users` metadata, ou alternativamente mostraremos o email gerado (que contém o username).

### Arquivos modificados/criados
- `src/pages/Configuracoes.tsx` — adicionar Tabs
- `src/components/settings/UserManagement.tsx` — novo componente
- Possível nova edge function `listar-usuarios` para buscar usernames do auth

