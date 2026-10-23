# Etapa 2 — Registro Diário da Turma

> **Status:** ✅ Concluída
> **Depende de:** Etapa 1
> **Tela de referência:** "Registro Diário da Turma"

## 🎯 Objetivo
Tela de uso cotidiano do professor. Ao final da aula, ele registra em **linguagem natural**
o que foi trabalhado, como a turma respondeu e outras observações.

## 🧰 Tecnologias
- Next.js (Server Actions)
- Prisma (modelo `Registro`)
- shadcn/ui (date picker, textarea, botões)

## ✅ Tarefas
- [x] Modelar `Registro` no Prisma (vínculo com `Turma`, texto original, status) _(feito na Etapa 0)_
- [x] Campo de **data** preenchido automaticamente, com ajuste manual
- [x] Três campos de texto: **o que foi trabalhado**, **desempenho observado**, **outras observações**
- [x] Salvar o **texto original do professor sem alterações**
- [x] Salvar como **rascunho** e permitir reabrir/editar enquanto não finalizado
- [x] Botão **"Analisar com IA"** presente _(placeholder; será ligado na Etapa 3)_
- [ ] Botão **"Ditar"** — opcional, adiado (fora do MVP inicial)

**Testado:** criar registro (`/turmas/[id]/registros/novo`), editar e salvar (persistiu), status "Rascunho", listagem na turma.

## 📦 Entregável (critério de conclusão)
Professor registra uma aula em poucos minutos, o texto original fica salvo intacto como
rascunho e há o botão para enviar à análise da IA.

## 📝 Notas da especificação
- Salvar o texto original **sem alterações**; a análise da IA fica **armazenada à parte**.
- Permitir reabrir e editar enquanto não estiver finalizado/enviado.
- Base: Regimento Comum (acompanhamento contínuo) e MSEP (avaliação formativa).
