# Etapa 6 — Painel da Coordenação

> **Status:** ✅ Concluída
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
- [x] Rota/visão exclusiva do papel **Coordenação**
- [x] Exibir **quantidade de registros recebidos** e **data do último envio**
- [x] Consolidar **pontos de atenção** e **pontos positivos**
- [x] Mostrar **intervenções sugeridas/realizadas**
- [x] Abrir o histórico completo da turma
- [x] Gerar **resumo da turma** por IA (a partir dos registros validados)
- [x] Considerar **apenas registros enviados** — rascunhos não aparecem

## 🛠️ Implementação
- `src/app/coordenacao/page.tsx` — lista as turmas com registros ENVIADOS
  (contagem de recebidos + data do último envio), gateada a COORDENACAO.
- `src/app/coordenacao/turmas/[id]/page.tsx` — visão consolidada da turma só
  sobre enviados: contagem, último envio, pontos positivos/atenção e
  intervenções sugeridas (agregados da última `Analise` VALIDADA de cada
  enviado), lista dos registros enviados com link para abrir cada um.
- `src/app/coordenacao/turmas/[id]/resumo-ia.tsx` — botão "Gerar resumo da
  turma com IA" (client), exibe o resumo em texto.
- `src/lib/actions/coordenacao.ts` — server action `gerarResumoTurma` (OpenAI).
- `src/app/dashboard/page.tsx` — link "Painel da Coordenação" só para COORDENACAO.

## 📦 Entregável (critério de conclusão)
Coordenação vê o painel calculado só sobre registros enviados, com contagem, último
envio, pontos consolidados e um resumo gerado por IA.

## 📝 Notas da especificação
- No MVP, o painel considera **só registros explicitamente enviados**.
- Rascunhos do professor **não** aparecem como recebidos.
- **Evitar rankings** de professores/turmas nesta fase.
