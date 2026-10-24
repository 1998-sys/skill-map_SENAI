import { getOpenAI, OPENAI_MODEL } from "@/lib/openai";

const MODEL = OPENAI_MODEL || "gpt-5-nano";

// Um registro ENVIADO, com o conteúdo da sua última análise VALIDADA.
export type RegistroResumo = {
  data: string; // dd/mm/aaaa
  tema: string | null;
  capacidades: string[];
  pontosPositivos: string[];
  pontosAtencao: string[];
  sugestoes: string[];
  observacoes: string | null;
};

// Conteúdo da turma (registros ENVIADOS, em ordem cronológica) que a IA
// resume para a Coordenação.
export type ConteudoConsolidado = {
  turmaNome: string;
  cursoNome: string;
  totalEnviados: number;
  registros: RegistroResumo[];
};

const SYSTEM = `Você é um apoio à Coordenação pedagógica do SENAI. A partir dos registros de aula enviados pelo professor (cada um já com a análise validada por ele), escreva um resumo executivo da turma, objetivo e em português do Brasil.

Os registros vêm em ordem cronológica, com data, tema, capacidades identificadas, pontos positivos, pontos de atenção, intervenções sugeridas e observações.

Organize em:
1. Visão geral: o percurso da turma no período (primeira e última data) e os temas trabalhados.
2. Evolução: dificuldades que se repetem ao longo das aulas, as que deixaram de aparecer e avanços que surgiram, citando as datas (ex.: "aparece em 18/09 e 22/09; não é mais citada a partir de 24/09"). Se houver uma intervenção sugerida seguida de melhora, aponte a relação como possibilidade, não como certeza.
3. Capacidades: as que mais aparecem e as que aparecem pouco no período.
4. Recomendações à Coordenação: pontos a acompanhar com o docente.

Regras:
- NÃO atribua nota, nível ou conceito. NÃO aprove nem reprove a turma ou alunos.
- NÃO faça ranking nem comparação com outras turmas ou professores.
- Baseie-se SOMENTE nos registros fornecidos; não invente dados nem generalize além deles. Com poucos registros, diga que a evolução ainda é limitada para conclusões.
- Seja conciso (poucos parágrafos ou tópicos curtos).`;

function montarMensagem(conteudo: ConteudoConsolidado) {
  const lista = (itens: string[]) =>
    itens.length ? itens.map((i) => `  - ${i}`).join("\n") : "  (nenhum)";

  const blocos = conteudo.registros.map(
    (r, i) => `REGISTRO ${i + 1} — ${r.data}${r.tema ? ` — Tema: ${r.tema}` : ""}
Capacidades identificadas:
${lista(r.capacidades)}
Pontos positivos:
${lista(r.pontosPositivos)}
Pontos de atenção:
${lista(r.pontosAtencao)}
Intervenções sugeridas:
${lista(r.sugestoes)}${r.observacoes ? `\nObservações adicionais: ${r.observacoes}` : ""}`,
  );

  return `TURMA: ${conteudo.turmaNome} — Curso: ${conteudo.cursoNome}
Registros enviados à Coordenação: ${conteudo.totalEnviados} (em ordem cronológica)

${blocos.join("\n\n")}`;
}

/** Valida o corpo recebido do cliente (formato do ConteudoConsolidado). */
export function lerConteudo(v: unknown): ConteudoConsolidado | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const textos = (x: unknown) =>
    Array.isArray(x) && x.every((i) => typeof i === "string") ? (x as string[]) : null;
  const textoOuNulo = (x: unknown) => (x === null || typeof x === "string" ? x : undefined);

  if (
    typeof o.turmaNome !== "string" ||
    typeof o.cursoNome !== "string" ||
    typeof o.totalEnviados !== "number" ||
    !Array.isArray(o.registros) ||
    o.registros.length > 500
  ) {
    return null;
  }

  const registros: RegistroResumo[] = [];
  for (const item of o.registros) {
    if (!item || typeof item !== "object") return null;
    const r = item as Record<string, unknown>;
    const capacidades = textos(r.capacidades);
    const pontosPositivos = textos(r.pontosPositivos);
    const pontosAtencao = textos(r.pontosAtencao);
    const sugestoes = textos(r.sugestoes);
    const tema = textoOuNulo(r.tema);
    const observacoes = textoOuNulo(r.observacoes);
    if (
      typeof r.data !== "string" ||
      !capacidades || !pontosPositivos || !pontosAtencao || !sugestoes ||
      tema === undefined || observacoes === undefined
    ) {
      return null;
    }
    registros.push({
      data: r.data,
      tema,
      capacidades,
      pontosPositivos,
      pontosAtencao,
      sugestoes,
      observacoes,
    });
  }

  return {
    turmaNome: o.turmaNome,
    cursoNome: o.cursoNome,
    totalEnviados: o.totalEnviados,
    registros,
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
