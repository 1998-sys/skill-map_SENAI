# Etapa 5 — Histórico da Turma

> **Status:** ✅ Concluída
> **Depende de:** Etapa 4
> **Tela de referência:** "Histórico da Turma"

## 🎯 Objetivo
Consolidar, em ordem cronológica, todos os registros da turma, formando a **memória
pedagógica do curso**.

## 🧰 Tecnologias
- Next.js (Server Components para listagem)
- Prisma (consultas com filtros e busca)
- shadcn/ui (tabela, filtros, busca)

## ✅ Tarefas
- [x] Listar em ordem cronológica: **data, aula/tema, capacidades relacionadas, síntese, status**
- [x] Abrir cada **registro completo** (link para `/turmas/[id]/registros/[registroId]`)
- [x] Filtrar por **status** (Rascunho / Enviado / Todos) e **busca** (`?status=&q=`)
- [x] **Busca** em tema, relato (textoTrabalhado/Desempenho/Observações), capacidades e síntese/análise
- [x] Exibir **data/hora do envio** quando o status for "Enviado à Coordenação"
- [x] Não apagar registros enviados (a tela é somente leitura; nenhuma exclusão)
- [ ] (Futuro) gerar relatório consolidado do curso
- [ ] (Futuro) filtro por período (data)

## 🛠️ Implementação
- Rota: `src/app/turmas/[id]/historico/page.tsx` (Server Component) — valida dono via
  `getCurrentProfile()` + `professorId`, carrega registros com a última `Analise`
  (versão mais recente) e suas capacidades identificadas.
- Filtro de status aplicado no Prisma; busca `q` aplicada em memória sobre o conteúdo
  consolidado (relato + capacidades + pontos/sugestões da análise).
- Síntese = 1º `pontosAtencao` (ou `pontosPositivos`) da última análise, com fallback
  para um trecho de `textoTrabalhado`.
- Filtros: `src/app/turmas/[id]/historico/filtros.tsx` (client) atualiza a URL.
- Link "Ver histórico" adicionado em `src/app/turmas/[id]/page.tsx`.

## 📦 Entregável (critério de conclusão)
Lista cronológica navegável com filtros e busca funcionais; cada registro pode ser
aberto por completo e mostra seu status (e data/hora de envio quando aplicável).

## 📝 Notas da especificação
- A busca deve cobrir tema, relato, capacidades e síntese.
- O histórico materializa o caráter contínuo do acompanhamento pedagógico.
