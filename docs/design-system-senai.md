# Identidade visual SENAI — aplicação do design system real

> Troca a "pele" do SkillMap pelo **design system oficial do SENAI-SP** (pasta
> `senai-design-system/`), **mantendo intactos layout, fluxos e funcionalidades** das
> etapas 0–6 e do redesign D0–D5.
> Última atualização: 2026-10-24 · Status: 🟡 em andamento (S0–S4 ✅)

> **S4:** telas do professor revisadas com sessão de Professor (1280px e 375px): Turma,
> Registro (rascunho, enviado e modo edição da análise), Novo registro, Histórico. Único
> ajuste: a topbar estourava no celular em subtítulos longos (Montserrat é mais larga
> que a Inter) — agora o subtítulo trunca (`min-w-0`) e "Sair" não encolhe.

> **Após a S3:** nenhum hex fixo resta nos `.tsx` — tudo via tokens. Novos:
> `TitleAccent` (sublinhado vermelho, em `section-card.tsx`); `StatCard` com cores
> `brand | neutral | warning | success` e filete vermelho; cabeçalhos de tabela em
> `bg-surface-strong`. Contraste: texto vermelho sobre o fundo cinza usa
> `text-primary-active` (`#AA0614`, ~6:1) — `#E30613` sobre `#E6E6E6` dá só ~3.9:1.
> S4/S5 viram revisão fina tela a tela (a maior parte já herdou o visual).

---

## 1. Princípio

**Muda a aparência, não a estrutura.** Sidebar + topbar, cartões, tabelas, seções
numeradas, formulários, rotas, server actions, Prisma, auth e IA continuam iguais. O que
muda: cores, tipografia, raios, logo, detalhes decorativos (barra vermelha, filete
lateral) e estados (hover/foco/status).

Regra prática: se uma etapa exigir mexer em `src/lib/actions`, `prisma/`, queries ou na
ordem/estrutura dos blocos de uma tela, ela saiu do escopo.

---

## 2. O que o design system SENAI define

Fonte: `senai-design-system/design-system.html` (abas *Overview* e *Components*). Para
visualizar com o CSS carregado, sirva a pasta (abrir o arquivo direto quebra os estilos):

```bash
python -m http.server 8765 --directory senai-design-system
```

Depois abra `http://127.0.0.1:8765/design-system.html`.

### Cores

| Token SENAI | Hex | Uso no SENAI |
|---|---|---|
| Vermelho SENAI | `#E30613` | marca, barras, botões, filetes |
| Vermelho hover | `#C20717` | hover de botões/links |
| Vermelho pressionado | `#AA0614` | active |
| Vermelho escuro | `#B91D32` | faixas institucionais (rodapé, banners) |
| Título | `#1A1A1A` | h1–h2 |
| Texto principal | `#333333` | corpo, links de menu |
| Cinza neutro | `#666666` | texto de apoio |
| Texto secundário | `#737373` | legendas (só sobre branco — ver contraste) |
| Fundo da página | `#E6E6E6` | `body` |
| Cinza claro | `#E5E9EA` | faixas/cabeçalhos neutros |
| Borda suave | `#F4F4F4` | bordas de itens |
| Branco | `#FFFFFF` | cartões, texto sobre vermelho |

### Tipografia
- **Montserrat** (principal): corpo 400; menus e rótulos 600; **títulos 800**; rótulos
  de rodapé em 600 maiúsculo.
- **Poppins** (secundária): apoio pontual.

### Padrões visuais recorrentes
- **Barra vermelha** sob o header (`.bb-red`) e **sublinhado vermelho** nos títulos de seção.
- **Tiles brancos com filete vermelho à esquerda** (`border-left: 5px solid #E30613`).
- **Cantos retos ou quase retos** (0–4px); arredondamento grande só em destaques.
- Fundo cinza `#E6E6E6` com conteúdo em blocos brancos.
- Logo oficial: `assets/overview/assets/9cb9a407d2b93d5c_senai.svg` (letreiro branco
  sobre vermelho).

---

## 3. Mapeamento: SkillMap atual → SENAI

| Elemento | Hoje (D0–D5) | Com o design system SENAI |
|---|---|---|
| `--primary` | azul `#2563EB` | vermelho `#E30613` (hover `#C20717`, active `#AA0614`) |
| `--background` | `#EEF2F7` | `#E6E6E6` |
| `--foreground` / títulos | `#16233D` | `#333333` / `#1A1A1A` |
| `--muted-foreground` | `#6B7486` | `#666666` |
| `--border` | `#E3E9F2` | `#DCDCDC` (o `#F4F4F4` some sobre branco) |
| `--ring` (foco) | azul | vermelho `#E30613` |
| Fonte | Inter | **Montserrat** (títulos 800) |
| Raio (`--radius`) | 10px (cartões 14px) | 4px (cartões 6px) |
| Sidebar | gradiente navy | **a decidir** (§5, D1) |
| Logo | texto "SENAI / SkillMap" | SVG oficial SENAI + "SkillMap" |
| Topbar | branca, borda cinza | branca, **barra vermelha** inferior de 3px |
| Títulos de cartão | bold 24px | Montserrat 800 + sublinhado/filete vermelho |
| Pílula "Enviado" | azul | **a decidir** (§5, D2) |
| Pílula "Rascunho" | verde | verde (mantém) |
| `--destructive` | vermelho padrão | vermelho escuro distinto + ícone (não confundir com a marca) |
| Círculo numerado (Análise) | azul claro | vermelho claro `#FDE7E8` + número vermelho |
| StatCards | ícones azul/laranja/verde | vermelho / âmbar / verde sobre fundos claros |

### Cores fixas no código que precisam virar token
Precisam ser trocadas na S1/S3 (hoje estão como hex direto):
- `src/app/(app)/app-shell.tsx`: gradiente navy, `#CDD8EA`, `#5AA6EF`.
- `src/components/ui/status-badge.tsx`: azul e verde.
- `src/components/ui/stat-card.tsx`: azul, laranja e verde.
- `src/components/analise-secoes.tsx`, `coordenacao/turmas/[id]/page.tsx`: `#E4EDFB`.
- `src/app/(app)/dashboard/page.tsx`: `#E8F0FD`.
- `registro-form.tsx`: `#2E9E54`.

### Contraste (WCAG AA, texto normal ≥ 4.5:1)
- Branco sobre `#E30613`: ~4.9:1 ✅ (botões ok).
- `#E30613` sobre branco: ~4.9:1 ✅ (links/textos vermelhos ok).
- `#737373` sobre `#E6E6E6`: ~3.8:1 ❌. Por isso usamos **`#666666`** como texto de
  apoio, e texto de apoio fica preferencialmente sobre branco.

---

## 4. Etapas

Cada etapa segue a mesma regra do redesign: **só apresentação → build → teste no
navegador (1280px e 375px, Professor e Coordenação) → commit.**

| # | Etapa | Escopo | Status |
|---|---|---|---|
| S0 | Decisões e base | Fechar as decisões da §5; copiar o logo para `public/brand/`; decidir o que fazer com a pasta `senai-design-system/` no git | ✅ Concluída |
| S1 | Tokens de cor e tipografia | `globals.css` (`:root` com a paleta SENAI, raio, foco); Montserrat via `next/font` no lugar da Inter; tokens semânticos para status e destaques (`--brand-soft`, `--success`, `--warning`) | ✅ Concluída |
| S2 | App shell | Sidebar no padrão escolhido, logo oficial, item ativo em vermelho; topbar com barra vermelha de 3px; drawer mobile no mesmo padrão; login com a marca | ✅ Concluída |
| S3 | Componentes base | `Button` (variantes `default` e `outline-primary` em vermelho, hover/active SENAI); `SectionCard` (título 800 + filete/sublinhado vermelho); `StatCard`; `StatusBadge`; `InfoField`; `PageNote`; inputs/selects/textarea (borda e foco); cabeçalho de tabela; `analise-secoes` (círculo numerado) | ✅ Concluída |
| S4 | Telas do professor | Revisão tela a tela (Início, Minhas turmas, Nova turma, Turma, Registro/Análise, Histórico); remover hex soltos restantes; nenhum bloco muda de lugar | ✅ Concluída |
| S5 | Telas da Coordenação | Lista, painel da turma (StatCards, pontos de atenção numerados), registro somente leitura, resumo IA | ⬜ |
| S6 | QA visual + acessibilidade | Contraste AA em todos os pares; foco visível; estados hover/disabled; 375px sem overflow; comparação lado a lado com o design system; atualizar docs (`CLAUDE.md`, `redesign-design-system.md`) | ⬜ |

Sugestão de ordem de commits: S1 e S3 trocam a maior parte do visual de uma vez, porque
as telas já usam tokens e componentes. S4 e S5 ficam como revisão fina.

### Detalhe por etapa

**S1 — Tokens**
- [ ] Paleta da §3 em `:root` (`--primary`, `--background`, `--foreground`, `--muted-foreground`, `--border`, `--input`, `--ring`, `--accent`, `--secondary`, `--sidebar-*`).
- [ ] Novos tokens: `--brand-soft` (`#FDE7E8`), `--success` / `--success-soft`, `--warning` / `--warning-soft`, `--title` (`#1A1A1A`).
- [ ] `--radius` → 0.25rem.
- [ ] `layout.tsx`: `Montserrat` (pesos 400/600/700/800) em `--font-sans`.
- [ ] Classe utilitária para títulos (800, cor `--title`).

**S2 — Shell**
- [ ] Sidebar conforme a decisão D1; item ativo com fundo vermelho (ou filete vermelho de 4px à esquerda, conforme D1).
- [ ] Logo SVG oficial + "SkillMap" na sidebar (desktop e drawer).
- [ ] Topbar: `border-b-[3px] border-primary`; subtítulo em `#666`.
- [ ] Login: cartão branco, logo, botão vermelho.

**S3 — Componentes**
- [ ] `button.tsx`: hover `#C20717`, active `#AA0614`; `outline-primary` com borda e texto vermelhos.
- [ ] `section-card.tsx`: título Montserrat 800 + sublinhado vermelho curto (40–48px × 3px), conforme D3.
- [ ] `stat-card.tsx`: cores por token; filete vermelho à esquerda opcional.
- [ ] `status-badge.tsx`: conforme D2.
- [ ] `info-field.tsx`: fundo `#F2F2F2`; nota ⓘ em `#666`.
- [ ] `analise-secoes.tsx`: círculo `--brand-soft` com número vermelho; marcador da lista em vermelho.
- [ ] Inputs, select e textarea: borda `--input`, foco com anel vermelho.
- [ ] Cabeçalho de tabela: fundo `#E5E9EA` (cinza claro SENAI).

**S4/S5 — Telas**
- [ ] Trocar todos os hex fixos listados na §3 por tokens.
- [ ] Conferir cada tela com a referência anterior: **mesma estrutura**, nova pele.

**S6 — QA**
- [ ] Contraste AA (texto e componentes de interface).
- [ ] Foco visível em todos os controles; `prefers-reduced-motion` respeitado.
- [ ] 1280px e 375px, Professor e Coordenação, sem overflow horizontal.
- [ ] Atualizar `CLAUDE.md` (tokens/fonte) e marcar as etapas aqui.

---

## 5. Decisões (fechadas na S0 — 2026-10-24)

Todas as recomendações foram **aceitas** e a prévia visual foi aprovada
(canvas "SkillMap — Prévia SENAI": Turma, Análise, Coordenação, guia de tokens).
- D1 → sidebar **branca**, item ativo `#FDE7E8` + filete vermelho de 4px.
- D2 → "Enviado" em vermelho claro (`#FDE7E8` / `#AA0614`); "Rascunho" verde `#E7F6EC` / **`#1E7B3F`**
  (o `#2E9E54` atual não passa AA sobre o fundo claro).
- D3 → sublinhado vermelho (44×3px) nos títulos de cartão; filete lateral só em StatCards.
- D4 → `senai-design-system/` no `.gitignore`.
- D5 → logo oficial em `public/brand/senai.svg`.

| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| D1 | Cor da sidebar | (a) **branca** com item ativo em vermelho e filete; (b) **grafite** `#1A1A1A`/`#333` com ativo vermelho; (c) **vermelho escuro** `#B91D32` | **(a) branca** — é o padrão do SENAI (header branco + vermelho como acento); (b) é a alternativa se quiser manter a sidebar escura |
| D2 | Pílula "Enviado à Coordenação" | (a) vermelho claro `#FDE7E8` / `#C20717`; (b) cinza grafite `#E5E9EA` / `#333` | **(a)**, porque "enviado" é o estado final e o vermelho é a cor de destaque. "Rascunho" segue verde |
| D3 | Destaque dos títulos de cartão | (a) sublinhado vermelho curto sob o título; (b) filete vermelho de 5px à esquerda do cartão (tile SENAI) | **(a)** nos cartões de seção e **(b)** só em StatCards e itens de lista |
| D4 | Pasta `senai-design-system/` (35 MB, cópia do portal) | (a) adicionar ao `.gitignore` e manter local; (b) versionar | **(a)**: é material de referência, com scripts e fontes de terceiros, e não deve ir para o repositório |
| D5 | Logo SENAI na interface | (a) SVG oficial; (b) texto estilizado | **(a)**, desde que o uso da marca no SkillMap esteja autorizado pelo SENAI (confirmar com a Coordenação antes do piloto) |

---

## 6. Fora do escopo
- Elementos do portal que não se aplicam a um sistema interno: carrossel, banners,
  barra Grupo FIESP, rodapé institucional, ícones de áreas de curso, botões de redes sociais.
- Mudanças de layout, novas telas, novos campos ou fluxos.
- Dependências do portal (Bootstrap, jQuery, Font Awesome): seguimos com Tailwind +
  shadcn + lucide; só os **valores** (cores, fonte, raio) são portados.
