# Etapa 1 — Turma / Curso + Capacidades

> **Status:** ✅ Concluída
> **Depende de:** Etapa 0
> **Tela de referência:** "Turma / Curso"

## 🎯 Objetivo
Configurar a turma e fornecer à IA a **base de capacidades** que será usada durante todo
o acompanhamento. Preparar a turma **uma única vez**, sem burocracia de cadastro a cada aula.

## 🧰 Tecnologias
- Next.js (Server Actions para o CRUD)
- Prisma (modelos `Curso`, `Turma`, `Capacidade`)
- shadcn/ui (formulários, textarea, listas)

## ✅ Tarefas
- [x] Modelar `Curso`, `Turma` e `Capacidade` no Prisma + migration _(feito na Etapa 0)_
- [x] Formulário de cadastro: curso, turma, período, carga horária _(professor = usuário logado)_
- [x] Campo "colar capacidades" (textarea) que quebra o bloco em **itens individuais**
- [x] Salvar **cada capacidade como registro próprio**, com ID interno e texto
- [x] Listar capacidades cadastradas da turma
- [x] Permitir **editar/adicionar/remover** capacidades depois (inclui colar em bloco)
- [x] Mostrar na tela os registros já existentes + botão "Novo registro" _(placeholder; ativa na Etapa 2)_
- [ ] (Opcional) categorização técnica × socioemocional — adiada (fora do MVP)

**Testado em `/turmas/nova` → `/turmas/[id]`:** criar turma, colar 5 capacidades (viram 5 itens), adicionar/editar/remover — tudo persistindo no banco com toasts de feedback.

## 📦 Entregável (critério de conclusão)
Professor consegue criar uma turma, colar a lista de capacidades (que vira itens
individuais com ID) e editá-la; a tela já oferece acesso ao histórico e ao novo registro.

## 📝 Notas da especificação
- Armazenar **cada capacidade como item individual**, mesmo colada em bloco.
- Permitir edição posterior da lista.
- **Não** exigir classificação técnica × socioemocional no MVP.
- Base MSEP: capacidades do Plano de Curso orientam a prática pedagógica.
