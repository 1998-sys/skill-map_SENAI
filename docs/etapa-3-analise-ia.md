# Etapa 3 — Análise Pedagógica com IA ⭐

> **Status:** ⬜ Pendente
> **Depende de:** Etapa 2
> **Tela de referência:** "Análise Pedagógica com IA"
> **É o coração do produto e a parte de maior risco técnico.**
>
> **Status:** ✅ Concluída

## 🎯 Objetivo
Transformar o relato do professor em uma **análise pedagógica organizada e acionável**,
relacionando-o às capacidades cadastradas — sempre com validação humana no fim.

## 🧰 Tecnologias
- **API da OpenAI** — modelo **`gpt-5-nano`** (configurável via `OPENAI_MODEL`)
- **Structured Outputs** (JSON Schema em modo `strict`) para garantir o formato
- Server Actions no **servidor** (protege a `OPENAI_API_KEY`)
- Prisma (modelos `Analise` e `AnaliseCapacidade`, com versões)

> Observação: originalmente planejado com Claude; trocado para OpenAI (gpt-5-nano)
> por decisão de custo. A troca ficou contida ao módulo de IA.

## 🔁 Entradas e saída
**Entrada fixa:** lista completa das capacidades da turma (cada uma com **ID interno** e texto).
**Entrada diária:** relato original do professor (3 campos da Etapa 2).

**Saída da IA (JSON, no backend):**
```json
{
  "capacidades_identificadas": ["<id>", "..."],
  "pontos_positivos": ["..."],
  "pontos_atencao": ["..."],
  "sugestoes": ["..."]
}
```

## ✅ Tarefas
- [x] Modelar `Analise` (versão original da IA **e** validada) _(feito na Etapa 0)_
- [x] Integrar o SDK da **OpenAI** no servidor (client lazy, `gpt-5-nano`)
- [x] Construir o prompt com a **regra fundamental**
- [x] Saída estruturada (JSON Schema strict) e **validação** do JSON antes de salvar
- [x] `capacidades_identificadas` restritas às da lista (códigos → IDs, descarta inválidos)
- [x] Tela de análise: capacidades (checkboxes), pontos positivos/atenção, sugestões
- [x] Permitir **editar** a análise e **gerar nova análise** ("Analisar novamente")
- [x] Guardar versão original da IA (IA_ORIGINAL) e a validada pelo professor (VALIDADA)
- [x] Observações sem relação clara → campo "observações adicionais"

**Testado:** registro real → "Analisar com IA" (gpt-5-nano, ~4-12s) → JSON válido,
capacidade correta marcada → edição → "Salvar análise validada" (v2, original preservada).

## 📜 Regra fundamental do prompt
> "Use exclusivamente as capacidades fornecidas. Não crie, renomeie ou combine
> capacidades. Se uma observação não estiver claramente relacionada a nenhuma capacidade
> cadastrada, registre-a em observações adicionais."

A IA **não** cria capacidades, **não** atribui nota/nível e **não** aprova/reprova.

## 📦 Entregável (critério de conclusão)
A partir de um relato real, a IA devolve JSON válido com capacidades (por ID),
pontos positivos/atenção e sugestões; o professor edita e valida; original e versão
validada ficam salvos.

## 🧭 Tela própria da Análise (fluxo da especificação, telas 4 → 5)
Antes a análise era um painel no fim da página do registro. Agora:
- **Registro Diário** (`/turmas/[id]/registros/[registroId]` e `/novo`): só o relato.
  Botões "Salvar rascunho" + **"Analisar com IA"** (salva e abre a Análise já gerando,
  via `intent=analisar` → `?gerar=1`); com análise existente: "Salvar e ver análise" e o
  link "Ver análise da IA".
- **Análise da IA** (`.../registros/[registroId]/analise`): resumo do registro + painel
  (seções numeradas, editar, novas sugestões, validar, enviar à Coordenação).
- **Submenu da turma** na sidebar: Turma / Curso · Registro Diário · Análise da IA ·
  Histórico da Turma. `/turmas/[id]/analise` é um atalho que abre a análise mais recente.
- Histórico: "Abrir" vai para a Análise quando ela existe.

## 📝 Notas
- Precisão não é absoluta → **validação humana obrigatória** é parte do design.
- Objetivo: reduzir trabalho de organizar informação e aumentar a qualidade do
  acompanhamento, não automatizar a decisão pedagógica.
