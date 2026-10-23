# Etapa 0 — Fundação

> **Status:** ✅ Concluída
> **Depende de:** nada (ponto de partida)
> **Produção:** https://skill-map-senai.vercel.app · **Repo:** https://github.com/1998-sys/skill-map_SENAI

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
- [x] Criar app Next.js (TS, Tailwind v4, App Router, `src/`, alias `@/*`)
- [x] Inicializar Git e `.gitignore` (já cobre `.env*`)
- [x] Mover as telas de referência (`.png`) e o PDF para `docs/referencia/`
- [x] Instalar e configurar shadcn/ui _(componentes adicionados conforme as telas)_
- [x] Criar projeto no Supabase e obter chaves _(URL + Publishable prontas; `SUPABASE_SERVICE_ROLE_KEY`/Secret opcional, usada só no servidor mais tarde)_
- [x] Configurar Prisma apontando para o Postgres do Supabase _(Prisma 6; `.env` só com as URLs do banco)_
- [x] **Migration inicial aplicada** + trigger de criação automática de `profile` (`prisma/sql/profile_trigger.sql`)
- [x] Criar clients do Supabase (browser e server) para Next.js
- [x] Implementar Auth: login/logout e os papéis **Professor** e **Coordenação**
- [x] Middleware de proteção de rotas
- [x] Layout base da aplicação (login + dashboard)
- [x] `.env.example` documentando todas as variáveis necessárias
- [x] Criar usuário de teste no Supabase e validar login de ponta a ponta _(login → dashboard com papel → logout, todos OK)_
- [x] Primeiro deploy na Vercel (repositório GitHub + variáveis de ambiente) _(produção validada: login → dashboard com papel, consultando o banco)_

## 📦 Entregável (critério de conclusão)
App publicado na Vercel, com login funcionando, papéis distintos e banco conectado
(uma migration aplicada com sucesso).

## 📝 Notas
- Chaves e segredos **nunca** no repositório — só em variáveis de ambiente.
- A `service role key` do Supabase só pode ser usada no servidor.
- O piloto tem **1 professor + Coordenação**; auth pode começar enxuta.
