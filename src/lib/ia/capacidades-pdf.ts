import { extractText, getDocumentProxy } from "unpdf";
import { getOpenAI, OPENAI_MODEL } from "@/lib/openai";

// Lê o PDF do Plano de Curso e devolve as unidades curriculares com as
// capacidades, para o professor REVISAR antes de salvar (a IA sugere, o
// professor decide).
//
// Estratégia para PDFs grandes (um Plano de Curso tem ~100 páginas):
//   1. Extrai o texto no servidor (unpdf) e manda à IA só as páginas que
//      falam de capacidades — mais rápido e barato.
//   2. Se o PDF não tiver texto (escaneado), manda o próprio PDF à IA, que lê
//      as imagens das páginas.

const MODEL = OPENAI_MODEL || "gpt-5-nano";

export type UnidadeExtraida = {
  nome: string;
  tecnicas: string[]; // "Capacidades Básicas" ou "Capacidades Técnicas"
  socioemocionais: string[];
};

const JSON_SCHEMA = {
  name: "capacidades_plano_curso",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["unidades"],
    properties: {
      unidades: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["nome", "capacidades_tecnicas", "capacidades_socioemocionais"],
          properties: {
            nome: {
              type: "string",
              description: "Nome da unidade curricular, sem a carga horária.",
            },
            capacidades_tecnicas: {
              type: "array",
              items: { type: "string" },
              description:
                "Itens listados em 'Capacidades Básicas' ou 'Capacidades Técnicas', copiados literalmente, sem numeração.",
            },
            capacidades_socioemocionais: {
              type: "array",
              items: { type: "string" },
              description:
                "Itens listados em 'Capacidades Socioemocionais', copiados literalmente, sem numeração.",
            },
          },
        },
      },
    },
  },
} as const;

const INSTRUCOES = `Você extrai capacidades de Planos de Curso do SENAI (Metodologia SENAI de Educação Profissional).
Para CADA unidade curricular da ementa de conteúdos formativos:
- "nome": o nome da unidade curricular, sem a carga horária (ex.: "Fundamentos dos processos logísticos").
- "capacidades_tecnicas": os itens de "Capacidades Básicas" ou "Capacidades Técnicas".
- "capacidades_socioemocionais": os itens de "Capacidades Socioemocionais".
Regras:
- Copie o texto LITERALMENTE. Não resuma, não reescreva, não corrija o sentido, não invente capacidades nem unidades.
- Uma capacidade pode estar quebrada em várias linhas: junte em uma só frase.
- Tire a numeração do início (1., 2., a) etc.).
- Corrija apenas espaços indevidos dentro de palavras causados pela extração do PDF (ex.: "cap acidades" → "capacidades").
- Ignore "Conhecimentos", objetivos, ambientes, referências e qualquer outro conteúdo.
- Se a mesma unidade aparecer repetida, junte em uma só.`;

// Páginas que listam capacidades (e a seguinte, caso a lista continue).
const MARCA_CAPACIDADES = /capacidades\s+(b[aá]sicas|t[eé]cnicas|socioemocionais)/i;
const MINIMO_DE_TEXTO = 300;

async function textoDasCapacidades(pdf: Uint8Array): Promise<string | null> {
  try {
    const doc = await getDocumentProxy(pdf);
    const { text: paginas } = await extractText(doc, { mergePages: false });
    const escolhidas = new Set<number>();
    paginas.forEach((t, i) => {
      if (MARCA_CAPACIDADES.test(t)) {
        escolhidas.add(i);
        if (i + 1 < paginas.length) escolhidas.add(i + 1);
      }
    });
    const texto = [...escolhidas]
      .sort((a, b) => a - b)
      .map((i) => `=== Página ${i + 1} ===\n${paginas[i]}`)
      .join("\n\n");
    return texto.length >= MINIMO_DE_TEXTO ? texto : null;
  } catch {
    return null; // PDF sem texto extraível: a IA lê o arquivo
  }
}

// "1. Identificar..." → "Identificar..."; espaços duplicados; repetidos.
function limpar(itens: string[]): string[] {
  const vistos = new Set<string>();
  const saida: string[] = [];
  for (const bruto of itens) {
    const t = bruto
      .replace(/^\s*(\d+(\.\d+)*|[a-zA-Z])\s*[.)\-–]\s+/, "")
      .replace(/\s+/g, " ")
      .trim();
    const chave = t.toLowerCase();
    if (t && !vistos.has(chave)) {
      vistos.add(chave);
      saida.push(t);
    }
  }
  return saida;
}

export async function extrairCapacidadesDoPdf(
  pdf: Uint8Array,
  nomeArquivo: string,
): Promise<UnidadeExtraida[]> {
  // O unpdf pode "consumir" o buffer: guarda uma cópia para o caso escaneado.
  const copia = pdf.slice();
  const texto = await textoDasCapacidades(pdf);

  const conteudo = texto
    ? [{ type: "text" as const, text: `Trechos do Plano de Curso:\n\n${texto}` }]
    : [
        {
          type: "file" as const,
          file: {
            filename: nomeArquivo || "plano-de-curso.pdf",
            file_data: `data:application/pdf;base64,${Buffer.from(copia).toString("base64")}`,
          },
        },
        { type: "text" as const, text: "Extraia as unidades curriculares e suas capacidades." },
      ];

  const completion = await getOpenAI().chat.completions.create({
    model: MODEL,
    reasoning_effort: "low",
    response_format: { type: "json_schema", json_schema: JSON_SCHEMA },
    messages: [
      { role: "system", content: INSTRUCOES },
      { role: "user", content: conteudo },
    ],
  });

  const bruto = completion.choices[0]?.message?.content;
  if (!bruto) return [];
  const dados = JSON.parse(bruto) as {
    unidades: {
      nome: string;
      capacidades_tecnicas: string[];
      capacidades_socioemocionais: string[];
    }[];
  };

  return dados.unidades
    .map((u) => ({
      nome: u.nome.replace(/\s*[—–-]\s*\d+\s*horas?\s*$/i, "").replace(/\s+/g, " ").trim(),
      tecnicas: limpar(u.capacidades_tecnicas),
      socioemocionais: limpar(u.capacidades_socioemocionais),
    }))
    .filter((u) => u.nome && u.tecnicas.length + u.socioemocionais.length > 0);
}
