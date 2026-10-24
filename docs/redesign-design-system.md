# Redesign — Design System SENAI

> Implementação do design system extraído das telas de referência, em etapas,
> **sem mudar a lógica** (server actions, Prisma, auth, OpenAI ficam intactos;
> mexemos só em layout, estrutura JSX e CSS).
> Proposta visual (canvas): as 5 telas no padrão SENAI.
> Última atualização: 2026-10-24

## Tokens (referência)

| Token | Valor | Uso |
|---|---|---|
| Azul primário | `#2563EB` | botões, acentos, links |
| Navy (sidebar) | `#153763 → #0B1D3A` | sidebar |
| Azul logo "SkillMap" | `#5AA6EF` | logo |
| Fundo | `#EEF2F7` | fundo da área de conteúdo |
| Card | `#FFFFFF` (borda `#E3E9F2`, raio 14px) | cartões |
| Texto título / corpo / apoio | `#16233D` / `#2B3550` / `#6B7486` | tipografia |
| Status Enviado | `#E4EDFB` / `#2563EB` | pílula |
| Status Rascunho/Salvo | `#E7F6EC` / `#2E9E54` | pílula |
| Fonte | **Inter** | toda a interface |

## Etapas

| # | Etapa | Escopo | Status |
|---|---|---|---|
| D0 | Fundação | Tokens de cor no tema, fonte Inter, variantes de botão | ✅ Concluída |
| D1 | App shell | Sidebar navy + topbar; navegação ativa por rota; Coordenação por papel; responsivo (drawer no mobile) | ✅ Concluída |
| D2 | Componentes base | StatusBadge, StatCard, SectionCard (inputs já ok via shadcn) | ✅ Concluída |
| D3 | Telas do professor | Turma/Capacidades, Registro, Análise (seções numeradas), Histórico | ✅ Concluída |
| D4 | Painel da Coordenação | Stat cards + consolidação | ✅ Concluída |
| D5 | Responsividade + QA | Auditoria mobile, consistência, ajustes finais | ✅ Concluída |

## Notas da D3

- Novos componentes: `InfoField` (campo somente leitura) e `PageNote` (nota ⓘ de rodapé)
  em `src/components/ui/info-field.tsx`; variante de botão `outline-primary`;
  `SectionCard` ganhou `description` e título maior.
- Topbar mostra o subtítulo por rota (Turma / Curso, Registro Diário, Histórico da Turma…).
- Análise abre em **modo leitura** (seções numeradas 1–5); "Editar" abre os campos.
- Histórico: tabela a partir de `lg`, cartões abaixo disso.
- **Fora do escopo (não existem hoje, seriam funcionalidade nova):** botão "Ditar",
  "Exportar histórico", filtros de Período/Aula. Rascunho segue rotulado "Rascunho"
  (referência usa "Salvo"). _"Analisar com IA" no formulário foi implementado depois —
  ver Etapa 3, "Tela própria da Análise"._

## Notas da D4

- `/coordenacao`: stat cards (turmas, registros recebidos, último envio) + tabela de turmas.
- Painel da turma: 4 stat cards, Turma/Curso/Professor, pontos de atenção numerados com
  contagem ("N registros", agrupando textos iguais — só exibição), pontos positivos,
  intervenções, resumo com IA, tabela de registros enviados.
- **Fora do escopo:** checkboxes de "intervenções realizadas" (precisaria persistir) e
  "Abrir histórico completo" (o histórico é restrito ao professor dono).
- **Corrigido (após a D4):** "Abrir" de um registro enviado dava 404 para a Coordenação.
  Agora aponta para `/coordenacao/turmas/[id]/registros/[rid]` — visão **somente leitura**
  (dados da turma, relato, última análise VALIDADA). Só papel COORDENACAO; rascunho ou
  turma divergente → 404. Seções numeradas extraídas para `src/components/analise-secoes.tsx`.

## Notas da D5

- **Datas centralizadas** em `src/lib/datas.ts`: `formatarData` (dia da aula, UTC — a data
  é salva como meia-noite UTC) e `formatarDataHora` / `formatarDiaDoInstante` (instantes
  como `enviadoEm`, **fuso America/Sao_Paulo** explícito). Antes, a Coordenação mostrava
  UTC (ex.: 11:44) e o professor o fuso do servidor (08:44 local, UTC na Vercel).
- Telas restantes no padrão: Início (`/dashboard`, cartões de atalho), Minhas turmas
  (tabela), Nova turma (cartões "Dados da Turma" + "Capacidades do Curso").
- `Textarea` do shadcn usa `field-sizing: content` (ignora `rows`): textareas principais
  ganharam `min-h-*`.
- QA a 1280px e 375px em todas as telas: sem overflow horizontal; drawer do menu ok.
  Telas do professor foram validadas na D3; na D5 só receberam datas e `min-h`.

## Regras

- Cada etapa é **só apresentação** — nenhuma query, action ou regra de negócio muda.
- Cada etapa: build + teste no navegador + commit.
- Mantém tudo que já funciona (fluxos, IA, envio, histórico, papéis).
