# SENAI SkillMap — Roadmap do MVP

> Memória pedagógica contínua da turma: o professor registra as aulas em linguagem
> natural, a IA cruza o relato com as **capacidades cadastradas do curso** e devolve
> uma análise estruturada que o docente valida e envia à Coordenação.
>
> **Princípio central:** o SkillMap *não* substitui Plano de Ensino, avaliação, diário,
> nota ou frequência. É uma **camada de acompanhamento pedagógico**. A IA apoia, não
> decide — validação humana é obrigatória.

Última atualização: 2026-10-23

---

## Stack do projeto

| Camada | Tecnologia |
|---|---|
| Framework / Linguagem | **Next.js 15 (App Router) + TypeScript** |
| UI | **Tailwind CSS + shadcn/ui** |
| Backend | **Server Actions / Route Handlers** do Next.js |
| Banco de dados | **Supabase (PostgreSQL)** + **Prisma ORM** |
| Autenticação | **Supabase Auth** (papéis: Professor e Coordenação) |
| IA | **API da Anthropic (Claude)** com saída estruturada (JSON / tool use) |
| Deploy | **Vercel** |

---

## Etapas

| # | Etapa | Status | Arquivo |
|---|---|---|---|
| 0 | Fundação (setup, deploy, auth) | 🟡 Em andamento | [etapa-0-fundacao.md](etapa-0-fundacao.md) |
| 1 | Turma / Curso + Capacidades | ⬜ Pendente | [etapa-1-turma-capacidades.md](etapa-1-turma-capacidades.md) |
| 2 | Registro Diário da Turma | ⬜ Pendente | [etapa-2-registro-diario.md](etapa-2-registro-diario.md) |
| 3 | Análise Pedagógica com IA | ⬜ Pendente | [etapa-3-analise-ia.md](etapa-3-analise-ia.md) |
| 4 | Envio à Coordenação + rastreabilidade | ⬜ Pendente | [etapa-4-envio-coordenacao.md](etapa-4-envio-coordenacao.md) |
| 5 | Histórico da Turma | ⬜ Pendente | [etapa-5-historico-turma.md](etapa-5-historico-turma.md) |
| 6 | Painel da Coordenação | ⬜ Pendente | [etapa-6-painel-coordenacao.md](etapa-6-painel-coordenacao.md) |
| 7 | Polimento + Piloto | ⬜ Pendente | [etapa-7-polimento-piloto.md](etapa-7-polimento-piloto.md) |

**Legenda de status:** ⬜ Pendente · 🟡 Em andamento · ✅ Concluída

---

## Convenções

- Cada etapa é **entregável e testável de ponta a ponta**.
- Tarefas concluídas são marcadas com `- [x]` e a etapa muda de status quando todas fecham.
- Correções em registros já enviados **nunca apagam** o anterior → criam nova versão
  (rastreabilidade).
- A IA **só** pode selecionar capacidades da lista cadastrada (por ID) — nunca inventar,
  renomear ou combinar, e nunca atribuir nota/nível.
