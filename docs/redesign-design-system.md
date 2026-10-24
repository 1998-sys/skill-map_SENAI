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
| D2 | Componentes base | Cards, inputs, badges de status, tabela | ⬜ |
| D3 | Telas do professor | Turma/Capacidades, Registro, Análise (seções numeradas), Histórico | ⬜ |
| D4 | Painel da Coordenação | Stat cards + consolidação | ⬜ |
| D5 | Responsividade + QA | Auditoria mobile, consistência, ajustes finais | ⬜ |

## Regras

- Cada etapa é **só apresentação** — nenhuma query, action ou regra de negócio muda.
- Cada etapa: build + teste no navegador + commit.
- Mantém tudo que já funciona (fluxos, IA, envio, histórico, papéis).
