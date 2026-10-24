"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/auth";
import { analisarRelato } from "@/lib/ia/analisar";

export type AnaliseActionState = { error?: string; ok?: boolean };

// Carrega o registro garantindo que o usuário atual é o professor dono,
// já com as capacidades da turma.
async function carregarRegistroDoDono(registroId: string) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const registro = await prisma.registro.findUnique({
    where: { id: registroId },
    include: {
      turma: {
        select: {
          professorId: true,
          capacidades: {
            orderBy: { ordem: "asc" },
            select: { id: true, texto: true },
          },
        },
      },
    },
  });
  if (!registro || registro.turma.professorId !== profile.id) return null;
  return registro;
}

async function proximaVersao(registroId: string) {
  const agg = await prisma.analise.aggregate({
    where: { registroId },
    _max: { versao: true },
  });
  return (agg._max.versao ?? 0) + 1;
}

const limpar = (arr: string[]) => arr.map((s) => s.trim()).filter(Boolean);

// Dispara a análise da IA e salva a versão original (IA_ORIGINAL).
export async function analisarRegistro(
  registroId: string,
): Promise<AnaliseActionState> {
  const registro = await carregarRegistroDoDono(registroId);
  if (!registro) return { error: "Registro inválido ou sem permissão." };

  const capacidades = registro.turma.capacidades;
  if (capacidades.length === 0) {
    return {
      error: "Cadastre as capacidades da turma antes de analisar com a IA.",
    };
  }
  if (!process.env.OPENAI_API_KEY) {
    return {
      error:
        "A chave da API da OpenAI não está configurada (OPENAI_API_KEY).",
    };
  }

  let resultado;
  try {
    resultado = await analisarRelato(capacidades, {
      tema: registro.tema,
      textoTrabalhado: registro.textoTrabalhado,
      textoDesempenho: registro.textoDesempenho,
      textoObservacoes: registro.textoObservacoes,
    });
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Falha ao chamar a IA.",
    };
  }

  const versao = await proximaVersao(registroId);
  await prisma.analise.create({
    data: {
      registroId,
      tipo: "IA_ORIGINAL",
      versao,
      pontosPositivos: resultado.pontosPositivos,
      pontosAtencao: resultado.pontosAtencao,
      sugestoes: resultado.sugestoes,
      observacoesAdicionais: resultado.observacoesAdicionais,
      capacidadesIdentificadas: {
        create: resultado.capacidadeIds.map((capacidadeId) => ({
          capacidadeId,
        })),
      },
    },
  });

  revalidatePath(`/turmas/${registro.turmaId}/registros/${registroId}`);
  return { ok: true };
}

// Salva a versão validada pelo professor (edição da análise).
export async function salvarAnaliseValidada(input: {
  registroId: string;
  capacidadeIds: string[];
  pontosPositivos: string[];
  pontosAtencao: string[];
  sugestoes: string[];
  observacoesAdicionais: string | null;
}): Promise<AnaliseActionState> {
  const registro = await carregarRegistroDoDono(input.registroId);
  if (!registro) return { error: "Registro inválido ou sem permissão." };

  const validas = new Set(registro.turma.capacidades.map((c) => c.id));
  const capacidadeIds = input.capacidadeIds.filter((id) => validas.has(id));

  const versao = await proximaVersao(input.registroId);
  await prisma.analise.create({
    data: {
      registroId: input.registroId,
      tipo: "VALIDADA",
      versao,
      pontosPositivos: limpar(input.pontosPositivos),
      pontosAtencao: limpar(input.pontosAtencao),
      sugestoes: limpar(input.sugestoes),
      observacoesAdicionais: input.observacoesAdicionais?.trim() || null,
      capacidadesIdentificadas: {
        create: capacidadeIds.map((capacidadeId) => ({ capacidadeId })),
      },
    },
  });

  revalidatePath(`/turmas/${registro.turmaId}/registros/${input.registroId}`);
  return { ok: true };
}
