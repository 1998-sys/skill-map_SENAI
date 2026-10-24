import { getOpenAI, OPENAI_MODEL } from "@/lib/openai";

// Modelo: definido por env; padrão gpt-5-nano (menor custo). Trocável por
// gpt-5-mini / gpt-4.1-mini no OPENAI_MODEL sem alterar código.
const MODEL = OPENAI_MODEL || "gpt-5-nano";

export type CapacidadeIA = { id: string; texto: string };
export type RelatoIA = {
  tema?: string | null;
  textoTrabalhado: string;
  textoDesempenho: string;
  textoObservacoes?: string | null;
};

export type AnaliseResultado = {
  capacidadeIds: string[]; // IDs reais (UUID) das capacidades identificadas
  pontosPositivos: string[];
  pontosAtencao: string[];
  sugestoes: string[];
  observacoesAdicionais: string | null;
};

// JSON Schema em modo strict: a IA retorna códigos (C1, C2...) das capacidades
// e listas de texto. Todos os campos são obrigatórios (exigência do strict).
const JSON_SCHEMA = {
  name: "analise_pedagogica",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      capacidades_identificadas: {
        type: "array",
        items: { type: "string" },
        description:
          "Códigos (ex.: C1, C3) das capacidades da lista com evidência clara no relato. Apenas códigos existentes; vazio se nenhuma.",
      },
      pontos_positivos: {
        type: "array",
        items: { type: "string" },
        description: "Avanços e aspectos positivos observados na turma.",
      },
      pontos_atencao: {
        type: "array",
        items: { type: "string" },
        description: "Dificuldades e pontos que merecem atenção.",
      },
      sugestoes: {
        type: "array",
        items: { type: "string" },
        description:
          "Sugestões concretas de atividades/exercícios/reforços para a próxima aula.",
      },
      observacoes_adicionais: {
        type: "string",
        description:
          "Observações sem relação clara com nenhuma capacidade. String vazia se não houver.",
      },
    },
    required: [
      "capacidades_identificadas",
      "pontos_positivos",
      "pontos_atencao",
      "sugestoes",
      "observacoes_adicionais",
    ],
  },
} as const;

const SYSTEM = `Você é um apoio pedagógico do SENAI. Sua função é relacionar o relato de uma aula às capacidades já cadastradas do curso e organizar observações acionáveis para o professor. Você NÃO substitui a avaliação do professor.

Regras fundamentais:
- Use EXCLUSIVAMENTE as capacidades fornecidas na lista. Não crie, renomeie ou combine capacidades.
- Em "capacidades_identificadas", retorne apenas os CÓDIGOS (ex.: C1, C3) das capacidades que têm evidência clara no relato. Se nenhuma tiver evidência clara, retorne lista vazia.
- NÃO atribua nota, nível ou conceito de desempenho. NÃO aprove nem reprove alunos ou a turma.
- Se uma observação relevante não estiver claramente relacionada a nenhuma capacidade cadastrada, registre-a em "observacoes_adicionais".
- Escreva em português do Brasil, de forma objetiva. As sugestões devem ser práticas e aplicáveis na próxima aula.`;

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function analisarRelato(
  capacidades: CapacidadeIA[],
  relato: RelatoIA,
): Promise<AnaliseResultado> {
  // Mapa código -> id real
  const porCodigo = new Map<string, string>();
  const linhas = capacidades.map((c, i) => {
    const code = `C${i + 1}`;
    porCodigo.set(code, c.id);
    return `[${code}] ${c.texto}`;
  });

  const userMsg = `CAPACIDADES CADASTRADAS DA TURMA:
${linhas.join("\n")}

RELATO DO PROFESSOR${relato.tema ? ` (tema: ${relato.tema})` : ""}:

O que foi trabalhado:
${relato.textoTrabalhado}

Desempenho observado da turma:
${relato.textoDesempenho || "(não informado)"}

Outras observações:
${relato.textoObservacoes || "(nenhuma)"}`;

  const completion = await getOpenAI().chat.completions.create({
    model: MODEL,
    reasoning_effort: "low",
    max_completion_tokens: 8000,
    response_format: { type: "json_schema", json_schema: JSON_SCHEMA },
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: userMsg },
    ],
  });

  const choice = completion.choices[0];
  if (choice?.message?.refusal) {
    throw new Error("A IA recusou analisar este relato.");
  }
  if (choice?.finish_reason === "length") {
    throw new Error("A resposta da IA foi cortada. Tente novamente.");
  }
  const content = choice?.message?.content;
  if (!content) {
    throw new Error("Resposta vazia da IA.");
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch {
    throw new Error("Não foi possível interpretar a resposta da IA.");
  }

  // Valida os códigos contra a lista (descarta qualquer código inventado).
  const ids = new Set<string>();
  for (const code of asStringArray(parsed.capacidades_identificadas)) {
    const id = porCodigo.get(code.toUpperCase());
    if (id) ids.add(id);
  }

  const obs =
    typeof parsed.observacoes_adicionais === "string"
      ? parsed.observacoes_adicionais.trim()
      : "";

  return {
    capacidadeIds: [...ids],
    pontosPositivos: asStringArray(parsed.pontos_positivos),
    pontosAtencao: asStringArray(parsed.pontos_atencao),
    sugestoes: asStringArray(parsed.sugestoes),
    observacoesAdicionais: obs || null,
  };
}
