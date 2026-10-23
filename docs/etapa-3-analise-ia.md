# Etapa 3 — Análise Pedagógica com IA ⭐

> **Status:** ⬜ Pendente
> **Depende de:** Etapa 2
> **Tela de referência:** "Análise Pedagógica com IA"
> **É o coração do produto e a parte de maior risco técnico.**

## 🎯 Objetivo
Transformar o relato do professor em uma **análise pedagógica organizada e acionável**,
relacionando-o às capacidades cadastradas — sempre com validação humana no fim.

## 🧰 Tecnologias
- API da Anthropic (Claude) com **saída estruturada** (tool use / JSON schema)
- Next.js Route Handler no **servidor** (protege a API key)
- Prisma (modelos `Analise` e versões)

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
- [ ] Modelar `Analise` no Prisma: versão original da IA **e** versão validada + migration
- [ ] Integrar o SDK da Anthropic no servidor
- [ ] Construir o prompt com a **regra fundamental** (ver abaixo)
- [ ] Forçar saída estruturada e **validar** o JSON (schema) antes de salvar
- [ ] Garantir que `capacidades_identificadas` contém **apenas IDs da lista** cadastrada
- [ ] Tela de análise: capacidades identificadas, pontos positivos, pontos de atenção, sugestões
- [ ] Permitir **editar** a análise e **pedir novas sugestões**
- [ ] Guardar versão original da IA e versão final validada pelo professor
- [ ] Observações sem relação clara → registrar em "observações adicionais"

## 📜 Regra fundamental do prompt
> "Use exclusivamente as capacidades fornecidas. Não crie, renomeie ou combine
> capacidades. Se uma observação não estiver claramente relacionada a nenhuma capacidade
> cadastrada, registre-a em observações adicionais."

A IA **não** cria capacidades, **não** atribui nota/nível e **não** aprova/reprova.

## 📦 Entregável (critério de conclusão)
A partir de um relato real, a IA devolve JSON válido com capacidades (por ID),
pontos positivos/atenção e sugestões; o professor edita e valida; original e versão
validada ficam salvos.

## 📝 Notas
- Precisão não é absoluta → **validação humana obrigatória** é parte do design.
- Objetivo: reduzir trabalho de organizar informação e aumentar a qualidade do
  acompanhamento, não automatizar a decisão pedagógica.
