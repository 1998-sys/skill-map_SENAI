# Mobile / Responsividade — SENAI SkillMap

> Registro da auditoria de responsividade e dos ajustes para uso em celular.
> Última atualização: 2026-10-24 · Testado a **375px** (iPhone, preset mobile).

---

## ✅ Já feito

### Auditado no navegador (viewport 375×812)
| Tela | Resultado |
|---|---|
| Login | ✅ OK — card centralizado, campos e botão em largura total, sem overflow |
| Detalhe da turma — **Capacidades** | 🔧 **Corrigido** (ver abaixo) |
| Detalhe da turma — Registros | ✅ OK — lista e botões cabem; cabeçalho quebra aceitável |
| Registro (3 campos) | ✅ OK — campos empilham, cabeçalho + badge quebram bem |
| Análise com IA | ✅ OK — grades de 2 colunas empilham em 1; checkboxes e textareas em largura total |

### Ajuste aplicado
- **Lista de capacidades** (`src/app/turmas/[id]/capacidades-editor.tsx`): em telas estreitas
  os botões **Editar/Remover** iam na lateral e espremiam o texto (chegava a 5 linhas).
  Agora eles **empilham abaixo** do texto no mobile (`flex-col` → `sm:flex-row`), dando
  largura total ao texto; em `sm+` voltam para a lateral.

### Padrões responsivos já usados na base (todas as telas)
- Containers com `max-w-*` + `mx-auto` e padding (`p-6`).
- Grades com `sm:grid-cols-2` (empilham em 1 coluna no mobile).
- Inputs, textareas e botões de formulário em largura total.
- Cabeçalhos com `flex-wrap` onde há título + ação (ex.: badge de status quebra abaixo).

---

## ⏳ Falta auditar visualmente no mobile

Risco **baixo** — usam os mesmos padrões já validados, mas não foram vistos a 375px:
- **Nova turma** (`/turmas/nova`) — formulário em grade `sm:grid-cols-2`.
- **Histórico** (`/turmas/[id]/historico`) — lista + filtros (`filtros.tsx`).
- **Painel da Coordenação** (`/coordenacao` e `/coordenacao/turmas/[id]`) — listas,
  consolidação e botão "Gerar resumo com IA".

---

## 🔜 Melhorias possíveis (polimento mais profundo)

- **Alvos de toque:** vários botões usam `size="sm"`/`ghost` (altura ~28px). Para toque
  confortável o ideal é ≥ ~40px de altura em ações principais no mobile.
- **Telas muito estreitas (< 360px):** revisar linhas densas (ex.: registros com data +
  tema + badge) para garantir que não haja corte.
- **Teclado virtual:** testar se o teclado cobre campos em formulários longos (registro,
  nova turma) em device real.
- **Device real:** validar em **iOS Safari** e **Android Chrome** (barra de endereço que
  aparece/some, `100vh`, safe areas/notch).
- **Orientação paisagem (landscape).**
- **Navegação:** hoje é por links/botões dentro de cada tela; avaliar um cabeçalho fixo
  com navegação em telas pequenas, se o piloto indicar necessidade.
- **Acessibilidade mobile:** foco visível, `aria-label` em ícones/ações, contraste.
- **(Opcional) PWA:** manifest + ícone para "adicionar à tela inicial".

---

## Como testar

- **Rápido:** navegador em modo responsivo a 375px (DevTools do Chrome, ou o painel do
  app com preset *Mobile*).
- **Real:** abrir a URL de produção (https://skill-map-senai.vercel.app) no celular.
