# Etapa 0 — Fundação

> **Status:** 🟡 Em andamento
> **Depende de:** nada (ponto de partida)

## 🎯 Objetivo
Montar o "encanamento" do projeto: aplicação criada, banco conectado, autenticação
básica funcionando e deploy na Vercel desde o início, para evitar surpresas de
infraestrutura mais tarde.

## 🧰 Tecnologias
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (projeto + PostgreSQL + Auth)
- Prisma ORM (schema + migrations)
- Vercel (deploy contínuo)

## ✅ Tarefas
- [ ] Criar app Next.js (TS, Tailwind, App Router, `src/`, alias `@/*`)
- [ ] Inicializar Git e `.gitignore` (incluir `.env*`)
- [ ] Mover as telas de referência (`.png`) e o PDF para `docs/referencia/`
- [ ] Instalar e configurar shadcn/ui (tema base, componentes iniciais)
- [ ] Criar projeto no Supabase e obter chaves (URL, anon key, service role)
- [ ] Configurar Prisma apontando para o Postgres do Supabase
- [ ] Criar clients do Supabase (browser e server) para Next.js
- [ ] Implementar Auth: login/logout e os papéis **Professor** e **Coordenação**
- [ ] Middleware de proteção de rotas por papel
- [ ] Layout base da aplicação (navegação, cabeçalho, container)
- [ ] `.env.example` documentando todas as variáveis necessárias
- [ ] Primeiro deploy na Vercel (variáveis de ambiente configuradas)

## 📦 Entregável (critério de conclusão)
App publicado na Vercel, com login funcionando, papéis distintos e banco conectado
(uma migration aplicada com sucesso).

## 📝 Notas
- Chaves e segredos **nunca** no repositório — só em variáveis de ambiente.
- A `service role key` do Supabase só pode ser usada no servidor.
- O piloto tem **1 professor + Coordenação**; auth pode começar enxuta.
