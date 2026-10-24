# SENAI SkillMap

Memória pedagógica contínua da turma: o professor registra as aulas em linguagem
natural e a IA relaciona aos **objetivos de aprendizagem (capacidades) do curso**,
sugerindo pontos de atenção e ações. Cada análise é validada pelo docente e enviada
à Coordenação, formando um histórico rastreável — **sem substituir** avaliação, nota
ou frequência.

🔗 **Produção:** https://skill-map-senai.vercel.app

---

## Stack

- **Next.js 16** (App Router, Turbopack) + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui**
- **Supabase** (Auth + PostgreSQL)
- **Prisma 6** (ORM / migrations)
- **OpenAI** (`gpt-5-nano`) com Structured Outputs (JSON Schema)
- Deploy na **Vercel**

## Funcionalidades

| # | Módulo | Descrição |
|---|---|---|
| 1 | Turma / Capacidades | Cadastro de curso/turma e das capacidades (colar em bloco → itens individuais) |
| 2 | Registro Diário | Relato da aula em 3 campos, como rascunho editável |
| 3 | Análise com IA | A IA cruza o relato com as capacidades e gera pontos positivos/atenção + sugestões; o docente edita e valida |
| 4 | Envio à Coordenação | Status Rascunho → Enviado, com data/hora e rastreabilidade (versões) |
| 5 | Histórico da Turma | Lista cronológica com filtros e busca |
| 6 | Painel da Coordenação | Visão consolidada (só registros enviados) + resumo por IA |

Papéis: **Professor** e **Coordenação**.

## Rodando localmente

```bash
# 1. Dependências
npm install

# 2. Variáveis de ambiente
cp .env.example .env.local        # preencha Supabase + OpenAI
#   crie também um .env com DATABASE_URL e DIRECT_URL (o Prisma lê de lá)

# 3. Banco (Prisma)
npx prisma generate
npx prisma migrate deploy          # aplica as migrations

# 4. Trigger de criação de profile (uma vez, após as migrations)
node --env-file=.env scripts/db/apply-profile-trigger.mjs

# 5. Dev server
npm run dev                        # http://localhost:3000
```

> Criar usuários: Supabase → Authentication → Add user (marque *Auto Confirm*).
> O papel padrão é `PROFESSOR`; para Coordenação, defina no SQL Editor:
> `update public.profiles set role='COORDENACAO' where email='...';`

## Scripts

| Comando | O quê |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servir o build |
| `npm run lint` | ESLint |

## Deploy (Vercel)

1. Importe o repositório na Vercel (detecta Next.js automaticamente).
2. Configure as **Environment Variables** (mesmas do `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` → **Config** (públicas)
   - `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DIRECT_URL`, `OPENAI_API_KEY` → **Secret**
   - `OPENAI_MODEL` (opcional)
3. Deploy. O `postinstall` roda `prisma generate` no build.

## Estrutura

```
src/
├── app/
│   ├── login/                     # autenticação
│   ├── dashboard/                 # início (+ link Coordenação)
│   ├── turmas/                    # turmas, capacidades, registros, análise, histórico
│   └── coordenacao/               # painel da Coordenação
├── lib/
│   ├── auth.ts                    # getCurrentUser / getCurrentProfile
│   ├── prisma.ts                  # client Prisma
│   ├── openai.ts                  # client OpenAI (lazy)
│   ├── ia/analisar.ts             # chamada de análise (structured output)
│   └── actions/                   # server actions (turmas, registros, analises, envio, coordenacao)
prisma/
├── schema.prisma                  # modelo de dados
├── migrations/                    # migrations
└── sql/profile_trigger.sql        # trigger auth.users → profiles
docs/                              # ROADMAP e especificação por etapa
```

## Roadmap

Ver [docs/ROADMAP.md](docs/ROADMAP.md). Etapas 0–6 concluídas; Etapa 7 (polimento + piloto) em andamento.
