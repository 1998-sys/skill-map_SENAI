# Etapa 2 — Registro Diário da Turma

> **Status:** ⬜ Pendente
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
- [ ] Modelar `Registro` no Prisma (vínculo com `Turma`, texto original, status) + migration
- [ ] Campo de **data** preenchido automaticamente, com ajuste manual
- [ ] Três campos de texto: **o que foi trabalhado**, **desempenho observado**, **outras observações**
- [ ] Salvar o **texto original do professor sem alterações**
- [ ] Salvar como **rascunho** e permitir reabrir/editar enquanto não finalizado
- [ ] Botão **"Analisar com IA"** (dispara a Etapa 3)
- [ ] Botão **"Ditar"** — opcional, pode ficar para depois

## 📦 Entregável (critério de conclusão)
Professor registra uma aula em poucos minutos, o texto original fica salvo intacto como
rascunho e há o botão para enviar à análise da IA.

## 📝 Notas da especificação
- Salvar o texto original **sem alterações**; a análise da IA fica **armazenada à parte**.
- Permitir reabrir e editar enquanto não estiver finalizado/enviado.
- Base: Regimento Comum (acompanhamento contínuo) e MSEP (avaliação formativa).
