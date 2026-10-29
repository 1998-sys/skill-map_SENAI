# Melhoria 1 — Dashboard de Acompanhamento (Coordenação)

> Evolução **pós-piloto** (fora do MVP). Painel para a **Coordenação** acompanhar se o
> SkillMap está sendo alimentado e em que pé está cada turma.
> **Escopo:** exclusivo da **Coordenação** (o professor NÃO tem esta tela). Só leitura.
> Última atualização: 2026-10-28 · Status: ⬜ Planejado

## 1. Objetivo

Dar à Coordenação uma visão consolidada de **cobertura e andamento** por turma:
quantas aulas já deveriam ter registro, quantas têm, e em que etapa cada registro está —
sem ranking de professores (regra do MVP). Serve para a Coordenação identificar turmas
que **não estão sendo alimentadas** e agir antes que o acompanhamento se perca.

## 2. Indicadores propostos

| Indicador | Descrição |
|---|---|
| Aulas registradas | Registros diários feitos (total e por semana) |
| Funil da análise | sem análise → gerada pela IA → validada → enviada |
| Tempo até o envio | Dias entre a data da aula e o envio à Coordenação |
| Atividade recente | Dias desde o último registro da turma |
| Aulas previstas | Carga horária ÷ duração de um encontro |
| Aulas ocorridas | Dias letivos do calendário da turma até hoje |
| Taxa de preenchimento | Aulas registradas ÷ aulas ocorridas |
| Dias letivos sem registro | Alerta quando a turma passa N dias letivos sem registrar |

## 3. De onde vêm os dados

Modelo atual (`prisma/schema.prisma`): `Turma{nome, periodo?, cargaHoraria?, professorId, createdAt}`,
`Registro{data, status, enviadoEm?, createdAt}`, `Analise{tipo, versao}`.

| Indicador | Fonte | Temos hoje? |
|---|---|---|
| Aulas registradas (total/semana) | `count(Registro)` agrupado por `data` (semana ISO) | ✅ Sim |
| Funil da análise | `Registro.status` + `Analise.tipo` (mesma lógica do `SituacaoBadge`) | ✅ Sim |
| Tempo até o envio | `enviadoEm − data` nos registros ENVIADO | ✅ Sim |
| Atividade recente (dias corridos) | `hoje − max(Registro.data)` | ✅ Sim |
| Último envio / registros recebidos | `max(enviadoEm)` / `count(status=ENVIADO)` | ✅ Sim (já no Painel) |
| **Aulas previstas** | `cargaHoraria ÷ duração do encontro` | ⚠️ Parcial — falta a **duração do encontro**; `cargaHoraria` existe mas é opcional |
| **Aulas ocorridas** | Calendário da turma (início, fim, dias da semana) | ❌ **Não** — falta o calendário |
| **Taxa de preenchimento** | Aulas registradas ÷ aulas ocorridas | ❌ Depende de "aulas ocorridas" |
| **Dias letivos sem registro** | Dias letivos do calendário × datas dos registros | ❌ Depende do calendário |

## 4. Temos capacidade para fazer a análise?

**Sim, mas em dois níveis:**

- ✅ **Já dá para calcular hoje, sem mudar o banco:** funil da análise, aulas registradas
  (total e por semana), tempo até o envio, último envio, registros recebidos e atividade
  recente (dias corridos desde o último registro). Tudo sai de `Registro` + `Analise` com
  agregações Prisma no servidor.
- ❌ **Os indicadores de cobertura do calendário** (aulas previstas, aulas ocorridas, taxa
  de preenchimento, dias **letivos** sem registro) **exigem dados novos na turma**, que
  hoje não existem: início/fim do período, dias da semana com aula e duração do encontro.
  O campo `periodo` é texto livre (ex.: "Noite", "2026/1"), não serve para cálculo.

**Infra:** nada externo é necessário — é só uma pequena extensão do schema (migration
Prisma no Supabase) + campos no formulário da turma. A stack atual (Next + Prisma +
Supabase) dá conta. O gráfico de "registros por semana" pode ser SVG inline (sem lib) ou
uma lib leve.

**Conclusão:** viável. A parte "funil + atividade" entrega valor já no começo; a parte
"cobertura" depende de adicionar o calendário da turma (etapa M1.1).

## 5. Decisões a fechar (antes da M1.1)

- **Visibilidade:** hoje a Coordenação só vê turmas com registros **enviados**. O dashboard
  de "alimentação" precisa ver **todas as turmas** (inclusive as que não enviaram nada —
  que são justamente o alerta). Confirmar que a Coordenação pode ver todas as turmas.
- **Modelo do calendário:** campos mínimos na `Turma` — `dataInicio` (Date), `dataFim`
  (Date, opcional), `diasSemana` (ex.: `Int[]` 1–7) e **duração do encontro**
  (`duracaoAulaMin` ou "horas-aula por encontro"). Alternativa mais simples: só
  `dataInicio` + `aulasPorSemana` (número), menos preciso mas sem mapear dias exatos.
- **"Dias sem registro" (N):** definir o limiar do alerta (ex.: 14 dias letivos).
- **Turmas antigas:** sem calendário preenchido, mostrar "cadastro incompleto" nos
  indicadores de cobertura (os de atividade/funil funcionam mesmo assim).

## 6. Etapas

| # | Etapa | Escopo | Status |
|---|---|---|---|
| M1.0 | Decisões e escopo | Fechar a §5 (visibilidade, modelo do calendário, limiar de alerta) | ⬜ |
| M1.1 | Calendário da turma | Campos novos na `Turma` + migration; formulário de nova turma / edição; turmas antigas = incompleto | ⬜ |
| M1.2 | Camada de cálculo | `src/lib/dashboard.ts` (ou action): funil, registros/semana, tempo até envio, atividade, e — com calendário — previstas/ocorridas/taxa/dias sem registro | ⬜ |
| M1.3 | Tela do dashboard | Rota `/coordenacao/dashboard` (gateada a COORDENACAO): StatCards + tabela de turmas + gráfico de registros/semana + alertas, no padrão SENAI | ⬜ |
| M1.4 | Alertas + QA | Destaques (turma parada, baixa cobertura), estados de "cadastro incompleto", build + teste (1280/375px, Coordenação) + commit | ⬜ |

> Ordem sugerida: M1.2 + M1.3 já entregam o dashboard com os indicadores que existem hoje
> (funil + atividade); M1.1 habilita a camada de cobertura. Dá para lançar em duas ondas.

## 7. Regras / fora do escopo

- **Sem ranking** de professores ou turmas — são indicadores de acompanhamento.
- Só **Coordenação** (o professor não tem esta tela nesta melhoria).
- Não muda os fluxos existentes (registro, análise, envio, histórico) — só **adiciona** o
  calendário na turma e a nova tela de leitura.
- Diferente do redesign (que era "só aparência"), esta melhoria **mexe no banco** (novos
  campos na `Turma`) e em um formulário — portanto tem migration e precisa de teste de dados.
