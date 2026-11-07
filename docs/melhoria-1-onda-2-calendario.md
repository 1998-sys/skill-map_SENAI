# Melhoria 1 — Onda 2: calendário da turma e cobertura dos registros

> **Objetivo:** saber, por turma, **quais dias tiveram aula** para controlar os
> registros: aulas previstas, aulas que já aconteceram, quais estão sem registro e
> quantas foram enviadas à Coordenação.
> **Situação:** implementado na branch `feat/calendario-turma`, aguardando aprovação.

## Como fica para o usuário (o mais simples possível)

1. Na **Nova turma** e na tela da turma, cartão **Calendário da turma** com 4 campos:
   **Início**, **Término**, **Dias de aula** (Seg … Sáb) e **Horas por dia**.
2. O sistema desenha os meses (como a planilha de horários do CFP) com os dias de
   aula marcados. **Feriados nacionais saem sozinhos**, inclusive os móveis.
3. **Um clique no dia** liga/desliga uma aula: emenda, feriado municipal, reposição.
4. Resumo **"N aulas · X h"** comparado com a carga horária, com aviso quando não
   bate (ex.: planilha com 9 sábados × 4 h = 36 h para uma carga de 60 h).

## Controle dos registros

- **Professor** (tela da turma): "Aulas sem registro" com as datas que já passaram e
  o botão **Registrar**, que abre o Registro Diário com a data preenchida.
- **Coordenação** (Dashboard), por turma: aulas previstas, aulas ocorridas até hoje,
  **cobertura** (aulas com registro ÷ aulas ocorridas), registros enviados e
  quantas aulas estão sem registro.
- Turmas sem calendário continuam como antes (os indicadores mostram "sem
  calendário").

## Decisões

| Tema | Decisão |
|---|---|
| O que é guardado | A regra (início, término, dias, horas/dia) para editar **e a lista final das datas de aula**, que é o que vale para os indicadores. |
| Feriados | Nacionais fixos (01/01, 21/04, 01/05, 07/09, 12/10, 02/11, 15/11, 20/11, 25/12) e móveis calculados pela Páscoa (Carnaval seg/ter, Sexta-feira Santa, Corpus Christi). Estaduais/municipais: clique no dia. |
| Mudar a regra | Mudar início, término ou dias **refaz** o calendário (os cliques manuais se perdem; a tela avisa). |
| Data de "hoje" | Fuso de Brasília. Aula de hoje conta como ocorrida. |
| Registro em dia sem aula | Continua permitido; não entra na cobertura. |

## Etapas

- [x] **C0 — Banco:** colunas `data_inicio`, `data_fim`, `dias_semana`,
  `horas_por_dia` e `datas_aula` em `turmas`
  (`prisma/migrations/20261107000000_calendario_turma`, idempotente).
  **Aplicar no SQL Editor do Supabase antes de usar/publicar.**
- [x] **C1 — Lógica:** `src/lib/calendario.ts` (feriados, Páscoa, geração das datas,
  resumo, cobertura), sem dependência de banco.
- [x] **C2 — Editor:** componente de calendário com os 4 campos, meses clicáveis,
  legenda e resumo × carga horária.
- [x] **C3 — Telas:** Nova turma (opcional) e tela da turma (cartão com **Salvar
  calendário**).
- [x] **C4 — Professor:** "Aulas sem registro" + **Registrar** com a data preenchida.
- [x] **C5 — Dashboard:** coluna de cobertura por turma e totais.
- [ ] **C6 — Testes e documentação** (depois de aplicar o SQL): salvar calendário,
  aulas sem registro, dashboard; atualizar `CLAUDE.md` e a visão geral.

## Para depois

- Importar o calendário direto da planilha de horários do CFP (`.xlsm`).
- Feriados estaduais/municipais cadastrados uma vez pela Coordenação (hoje: clique).
- Alerta automático quando a turma passa N aulas seguidas sem registro.
