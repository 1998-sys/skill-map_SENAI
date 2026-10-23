# Etapa 6 — Painel da Coordenação

> **Status:** ⬜ Pendente
> **Depende de:** Etapa 5
> **Tela de referência:** "Painel da Coordenação"

## 🎯 Objetivo
Dar à Coordenação uma visão **simples e consolidada** do acompanhamento pedagógico,
**sem interferir** na autonomia avaliativa do professor.

## 🧰 Tecnologias
- Next.js (rota protegida para papel Coordenação)
- Prisma (agregações sobre registros enviados)
- API Claude (resumo consolidado da turma)

## ✅ Tarefas
- [ ] Rota/visão exclusiva do papel **Coordenação**
- [ ] Exibir **quantidade de registros recebidos** e **data do último envio**
- [ ] Consolidar **pontos de atenção** e **pontos positivos**
- [ ] Mostrar **intervenções sugeridas/realizadas**
- [ ] Abrir o histórico completo da turma
- [ ] Gerar **resumo da turma** por IA (a partir dos registros validados)
- [ ] Considerar **apenas registros enviados** — rascunhos não aparecem

## 📦 Entregável (critério de conclusão)
Coordenação vê o painel calculado só sobre registros enviados, com contagem, último
envio, pontos consolidados e um resumo gerado por IA.

## 📝 Notas da especificação
- No MVP, o painel considera **só registros explicitamente enviados**.
- Rascunhos do professor **não** aparecem como recebidos.
- **Evitar rankings** de professores/turmas nesta fase.
