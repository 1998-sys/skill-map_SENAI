# Etapa 5 — Histórico da Turma

> **Status:** ⬜ Pendente
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
- [ ] Listar em ordem cronológica: **data, aula/tema, capacidades relacionadas, síntese, status**
- [ ] Abrir cada **registro completo**
- [ ] Filtrar por **período, tema e status**
- [ ] **Busca** em tema, relato, capacidades e síntese
- [ ] Exibir **data/hora do envio** quando o status for "Enviado à Coordenação"
- [ ] Não apagar registros enviados (mostrar versões quando houver)
- [ ] (Futuro) gerar relatório consolidado do curso

## 📦 Entregável (critério de conclusão)
Lista cronológica navegável com filtros e busca funcionais; cada registro pode ser
aberto por completo e mostra seu status (e data/hora de envio quando aplicável).

## 📝 Notas da especificação
- A busca deve cobrir tema, relato, capacidades e síntese.
- O histórico materializa o caráter contínuo do acompanhamento pedagógico.
