# Painel — Gestão de Dados

Painel de inteligência e gestão de dados da Dra. Fernanda Sarelli.

## Tecnologias

- **React 18** - Interface de usuário
- **TypeScript** - Type safety
- **Vite** - Build tool e dev server
- **TailwindCSS** - Styling
- **Shadcn/ui** - Component library
- **Supabase** - Backend e banco de dados
- **React Query** - Data fetching e caching
- **Playwright** - E2E testing
- **Vitest** - Unit testing

## Pré-requisitos

- Node.js 18+ (recomendado: usar [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Bun (opcional, para gerenciamento de dependências)

## Instalação

```bash
# Clone o repositório
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Instale as dependências
npm i
# ou
bun install
```

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as variáveis necessárias:

```env
VITE_SUPABASE_URL=<your_supabase_url>
VITE_SUPABASE_ANON_KEY=<your_supabase_key>
```

## Desenvolvimento

Inicie o servidor de desenvolvimento:

```bash
npm run dev
# ou
bun dev
```

O servidor ficará disponível em `http://localhost:8080`

## Build

Para produção:

```bash
npm run build
# ou
bun run build
```

Para development build:

```bash
npm run build:dev
```

## Testes

```bash
# Rodar testes unitários
npm run test

# Modo watch
npm run test:watch

# E2E tests (Playwright)
npx playwright test
```

## Lint

```bash
npm run lint
```

## Projeto

### Estrutura

```
src/
├── components/       # Componentes React
├── pages/           # Páginas da aplicação
├── contexts/        # React Contexts
├── hooks/           # Custom hooks
├── lib/             # Utilitários e constantes
├── integrations/    # Integrações externas
├── assets/          # Arquivos estáticos
└── App.tsx          # Componente raiz
```

### Principais componentes

- **Dashboard** - Visualização geral de dados
- **Mapa Goiás** - Mapa interativo do estado
- **Visitantes** - Gerenciamento de visitantes
- **Formulários** - Submissão e gerenciamento
- **Todas Interações** - Histórico completo

## Convenções

- Componentes em PascalCase
- Props interface sufixo com `Props`
- Arquivo de tipos: `index.ts` para barrels
- Utilitários em `lib/`
- Hooks em `hooks/`

## Maintenance

Este projeto é mantido pelo time de desenvolvimento. Para questões, features ou bugs, abra uma issue no repositório.
