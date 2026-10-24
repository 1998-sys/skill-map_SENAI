# SENAI SkillMap — guia para o Claude

Memória pedagógica contínua da turma: o professor registra as aulas em linguagem
natural e a **IA** relaciona às **capacidades (objetivos de aprendizagem) do curso**,
sugerindo pontos de atenção e ações. O docente valida e envia à Coordenação, com
histórico rastreável. A IA **não** substitui avaliação, nota ou frequência.

- **Produção:** https://skill-map-senai.vercel.app
- **Repo:** https://github.com/1998-sys/skill-map_SENAI

## Onde estamos (leia os docs antes de agir)

- `docs/ROADMAP.md` — etapas 0–7. **0–6 concluídas**, 7 (polimento/piloto) parcial.
- `docs/redesign-design-system.md` — redesign de layout (D0–D5 ✅).
- `docs/design-system-senai.md` — identidade visual **oficial SENAI** (S0–S6 ✅).
  **Próximo:** pendências da Etapa 7 (piloto real).
- Datas: use **sempre** `@/lib/datas` (`formatarData` p/ dia da aula em UTC;
  `formatarDataHora` p/ instantes no fuso de Brasília). Não crie `Intl.DateTimeFormat` solto.
- `docs/etapa-*.md` — spec por etapa. `docs/mobile-responsividade.md` — auditoria mobile.
- `docs/referencia/` — as 5 telas de referência (PNG) + PDF da especificação.

## Stack

Next.js 16 (App Router, Turbopack) + TypeScript · Tailwind v4 · shadcn/ui ·
Supabase (Auth + Postgres) · Prisma 6 · OpenAI (`gpt-5-nano`) · deploy Vercel.

## Convenções que PRECISA saber (pegadinhas)

- **shadcn Button é Base UI, NÃO tem `asChild`.** Para link com cara de botão:
  `import { buttonVariants } from "@/components/ui/button"` + `<Link className={buttonVariants({...})}>`.
- **Prisma fixado no 6.x** (`prisma` e `@prisma/client`). NÃO atualizar para 8.x
  (o `latest` do npm aponta para um RC que quebra: `url`/`directUrl` saem do schema).
- **Rotas internas ficam em `src/app/(app)/`** (grupo com shell: `layout.tsx` + `app-shell.tsx`,
  sidebar navy + topbar). URLs não mudam. Públicas: `login`, `auth`, `page.tsx` (redirect).
- **Se mover rotas, limpe o `.next`** antes do build (o validador de tipos fica stale):
  `rm -rf .next && npx next build`.
- **Auth:** middleware protege tudo. `@/lib/auth`: `getCurrentUser()`, `getCurrentProfile()`
  (`.id`, `.nome`, `.role` = `PROFESSOR|COORDENACAO`).
- **DB:** `import { prisma } from "@/lib/prisma"`. Schema em `prisma/schema.prisma`
  (Curso, Turma, Capacidade, Registro[status RASCUNHO|ENVIADO], Analise[tipo IA_ORIGINAL|VALIDADA], AnaliseCapacidade, Profile).
- **Trigger de profile NÃO é migration do Prisma** (o shadow DB não vê o schema `auth`):
  aplicar com `node --env-file=.env scripts/db/apply-profile-trigger.mjs`.
- **IA:** `@/lib/openai` (client lazy) + `@/lib/ia/analisar.ts` (análise, JSON Schema strict,
  `OPENAI_MODEL` padrão `gpt-5-nano`). Resumo da Coordenação: `@/lib/ia/resumo.ts` +
  rota de **streaming** `POST /api/coordenacao/resumo`. Texto de IA na tela usa
  `@/components/ia-escrita` (`useEscritaFluida`, `PensandoIA`, `SeloIA` "Gerado por IA").
- **Design tokens** em `src/app/globals.css` (`:root`, paleta **oficial SENAI-SP**: vermelho
  `#E30613`, fundo `#E6E6E6`, títulos `#1A1A1A`). Fonte **Montserrat** no layout raiz.
  Plano em andamento: `docs/design-system-senai.md` (S0–S6 ✅ concluído). Use tokens
  (`text-title`, `bg-brand-soft`, `text-success`…), nunca hex solto.
- Toda UI em **pt-BR**. Server actions em `src/lib/actions/*.ts` (`"use server"`, checam o dono).

## Rodar / validar

```bash
npm install
npx prisma generate
npx next build        # validar (limpe .next se moveu rotas)
npm run dev           # http://localhost:3000
```

Env: `.env.local` (app: Supabase + `OPENAI_API_KEY` + `OPENAI_MODEL`) e `.env`
(Prisma: `DATABASE_URL` pooler 6543 `?pgbouncer=true`, `DIRECT_URL` 5432). Modelo
documentado em `.env.example`. **Ambos são gitignored.**

## Produção (Vercel)

Variáveis: as do `.env.example` (as `NEXT_PUBLIC_*` como Config; o resto Secret,
incluindo **`OPENAI_API_KEY`** — senão a IA não roda em produção). `postinstall`
roda `prisma generate`.

## Ambiente

O projeto está numa pasta do **OneDrive** no Windows — o npm pode ficar lento e travar
se houver **dois `npm install` concorrentes** (rode um por vez).

## Testes com usuários

Supabase → Authentication → Add user (marque *Auto Confirm*). Papel padrão PROFESSOR;
para Coordenação: SQL Editor → `update public.profiles set role='COORDENACAO' where email='...';`
