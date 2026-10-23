# Etapa 1 — Turma / Curso + Capacidades

> **Status:** ⬜ Pendente
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
- [ ] Modelar `Curso`, `Turma` e `Capacidade` no Prisma + migration
- [ ] Formulário de cadastro: curso, turma, professor, período, carga horária
- [ ] Campo "colar capacidades" (textarea) que quebra o bloco em **itens individuais**
- [ ] Salvar **cada capacidade como registro próprio**, com ID interno e texto
- [ ] Listar capacidades cadastradas da turma
- [ ] Permitir **editar/adicionar/remover** capacidades depois
- [ ] Mostrar na tela os registros já existentes + botão "Novo registro"
- [ ] (Opcional) categorização técnica × socioemocional — pode ficar para depois

## 📦 Entregável (critério de conclusão)
Professor consegue criar uma turma, colar a lista de capacidades (que vira itens
individuais com ID) e editá-la; a tela já oferece acesso ao histórico e ao novo registro.

## 📝 Notas da especificação
- Armazenar **cada capacidade como item individual**, mesmo colada em bloco.
- Permitir edição posterior da lista.
- **Não** exigir classificação técnica × socioemocional no MVP.
- Base MSEP: capacidades do Plano de Curso orientam a prática pedagógica.
