import { getOpenAI, OPENAI_MODEL } from "@/lib/openai";

const MODEL = OPENAI_MODEL || "gpt-5-nano";

// Conteúdo consolidado da turma (já calculado a partir dos registros ENVIADOS)
// que será resumido pela IA. Texto puro basta para a Coordenação.
export type ConteudoConsolidado = {
  turmaNome: string;
  cursoNome: string;
  totalEnviados: number;
  pontosPositivos: string[];
  pontosAtencao: string[];
  sugestoes: string[];
};

const SYSTEM = `Você é um apoio à Coordenação pedagógica do SENAI. A partir de observações já consolidadas de vários registros de aula (enviados pelo professor), escreva um resumo executivo da turma, objetivo e em português do Brasil.

Regras:
- Dê uma visão geral do acompanhamento: avanços, dificuldades recorrentes e ações sugeridas.
- NÃO atribua nota, nível ou conceito. NÃO aprove nem reprove a turma ou alunos.
- NÃO faça ranking nem comparação com outras turmas ou professores.
- Seja conciso (poucos parágrafos). Pode usar tópicos curtos quando ajudar na leitura.
- Organize em: uma visão geral breve, as recorrências a acompanhar e as recomendações à Coordenação.
- Baseie-se SOMENTE nas observações fornecidas; não invente dados nem generalize além delas.`;

function montarMensagem(conteudo: ConteudoConsolidado) {
  const lista = (itens: string[]) =>
    itens.length ? itens.map((i) => `- ${i}`).join("\n") : "(nenhum)";

  return `TURMA: ${conteudo.turmaNome} — Curso: ${conteudo.cursoNome}
Registros enviados à Coordenação: ${conteudo.totalEnviados}

PONTOS POSITIVOS CONSOLIDADOS:
${lista(conteudo.pontosPositivos)}

PONTOS DE ATENÇÃO CONSOLIDADOS:
${lista(conteudo.pontosAtencao)}

INTERVENÇÕES SUGERIDAS:
${lista(conteudo.sugestoes)}`;
}

/** Valida o corpo recebido do cliente (formato do ConteudoConsolidado). */
export function lerConteudo(v: unknown): ConteudoConsolidado | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const textos = (x: unknown) =>
    Array.isArray(x) && x.every((i) => typeof i === "string") ? (x as string[]) : null;
  const pos = textos(o.pontosPositivos);
  const at = textos(o.pontosAtencao);
  const sug = textos(o.sugestoes);
  if (
    typeof o.turmaNome !== "string" ||
    typeof o.cursoNome !== "string" ||
    typeof o.totalEnviados !== "number" ||
    !pos || !at || !sug
  ) {
    return null;
  }
  return {
    turmaNome: o.turmaNome,
    cursoNome: o.cursoNome,
    totalEnviados: o.totalEnviados,
    pontosPositivos: pos,
    pontosAtencao: at,
    sugestoes: sug,
  };
}

/** Gera o resumo em streaming: devolve os pedaços de texto conforme a IA escreve. */
export async function* gerarResumoStream(
  conteudo: ConteudoConsolidado,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const stream = await getOpenAI().chat.completions.create(
    {
      model: MODEL,
      reasoning_effort: "low",
      max_completion_tokens: 8000,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: montarMensagem(conteudo) },
      ],
    },
    { signal },
  );

  for await (const chunk of stream) {
    const choice = chunk.choices[0];
    const texto = choice?.delta?.content;
    if (texto) yield texto;
    if (choice?.finish_reason === "length") {
      yield "\n\n[O resumo foi interrompido por limite de tamanho. Gere novamente.]";
    }
  }
}
