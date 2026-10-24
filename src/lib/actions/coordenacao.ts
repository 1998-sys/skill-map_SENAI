"use server";

import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { getOpenAI, OPENAI_MODEL } from "@/lib/openai";

const MODEL = OPENAI_MODEL || "gpt-5-nano";

export type ResumoState = { error?: string; resumo?: string };

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
- Baseie-se SOMENTE nas observações fornecidas; não invente dados.`;

// Gera um resumo da turma em texto puro, a partir do conteúdo consolidado dos
// registros ENVIADOS. Exclusivo para a Coordenação.
export async function gerarResumoTurma(
  conteudo: ConteudoConsolidado,
): Promise<ResumoState> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "COORDENACAO") {
    return { error: "Acesso restrito à Coordenação." };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      error: "A chave da API da OpenAI não está configurada (OPENAI_API_KEY).",
    };
  }

  if (conteudo.totalEnviados === 0) {
    return { error: "Esta turma ainda não tem registros enviados." };
  }

  const lista = (itens: string[]) =>
    itens.length ? itens.map((i) => `- ${i}`).join("\n") : "(nenhum)";

  const userMsg = `TURMA: ${conteudo.turmaNome} — Curso: ${conteudo.cursoNome}
Registros enviados à Coordenação: ${conteudo.totalEnviados}

PONTOS POSITIVOS CONSOLIDADOS:
${lista(conteudo.pontosPositivos)}

PONTOS DE ATENÇÃO CONSOLIDADOS:
${lista(conteudo.pontosAtencao)}

INTERVENÇÕES SUGERIDAS:
${lista(conteudo.sugestoes)}`;

  let completion;
  try {
    completion = await getOpenAI().chat.completions.create({
      model: MODEL,
      reasoning_effort: "low",
      max_completion_tokens: 8000,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userMsg },
      ],
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Falha ao chamar a IA." };
  }

  const choice = completion.choices[0];
  if (choice?.finish_reason === "length") {
    return { error: "A resposta da IA foi cortada. Tente novamente." };
  }
  const resumo = choice?.message?.content?.trim();
  if (!resumo) {
    return { error: "Resposta vazia da IA." };
  }

  return { resumo };
}
