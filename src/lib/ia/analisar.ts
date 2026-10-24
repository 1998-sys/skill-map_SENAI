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

const SYSTEM = `Você é um apoio pedagógico do SENAI. Relacione o relato de uma aula às capacidades já cadastradas do curso e organize observações acionáveis para o professor. Você NÃO substitui a avaliação do professor.

Regras fundamentais:
- Use EXCLUSIVAMENTE as capacidades fornecidas na lista. Não crie, renomeie nem combine capacidades.
- Em "capacidades_identificadas", retorne apenas os CÓDIGOS (ex.: C1, C3) das capacidades com evidência CLARA e explícita no relato. Na dúvida, não inclua. Se nenhuma tiver evidência clara, retorne lista vazia.
- NÃO atribua nota, nível ou conceito de desempenho. NÃO aprove nem reprove alunos ou a turma.
- Observação relevante sem relação clara com alguma capacidade → registre em "observacoes_adicionais" (string vazia se não houver).

Qualidade do conteúdo:
- Baseie-se SOMENTE no que está no relato; não invente fatos nem generalize além do descrito.
- Seja específico e conciso: cada item é uma frase curta e concreta, ancorada no relato — evite frases genéricas que serviriam para qualquer aula.
- Em geral 2 a 4 itens por lista; use menos se o relato for breve e deixe a lista vazia quando não houver evidência.
- Em "sugestoes", proponha ações práticas e aplicáveis na PRÓXIMA aula, ligadas às dificuldades observadas (uma atividade, exercício ou estratégia específica), nunca conselhos vagos.
- Escreva em português do Brasil, com tom objetivo e profissional.`;

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
