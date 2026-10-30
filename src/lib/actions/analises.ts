"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, exigir, novoId } from "@/lib/db/cliente";
import {
  buscarRegistro,
  listarCapacidades,
  ultimaVersaoAnalise,
  type AnaliseTipo,
} from "@/lib/db/consultas";
import { getCurrentProfile } from "@/lib/auth";
import { analisarRelato } from "@/lib/ia/analisar";

export type AnaliseActionState = { error?: string; ok?: boolean };

// Carrega o registro garantindo que o usuário atual é o professor dono,
// já com as capacidades da turma.
async function carregarRegistroDoDono(registroId: string) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const registro = await buscarRegistro(registroId);
  if (!registro || registro.turma.professorId !== profile.id) return null;
  const capacidades = (await listarCapacidades(registro.turmaId)).map(
    ({ id, texto }) => ({ id, texto }),
  );
  return { ...registro, capacidades };
}

// Grava uma nova versão da análise + as capacidades identificadas.
// O Prisma fazia isso numa transação; aqui são dois inserts e, se o segundo
// falhar, apagamos a análise para não ficar pela metade.
async function salvarAnalise(dados: {
  registroId: string;
  tipo: AnaliseTipo;
  pontosPositivos: string[];
  pontosAtencao: string[];
  sugestoes: string[];
  observacoesAdicionais: string | null;
  capacidadeIds: string[];
}) {
  const id = novoId();
  const versao = (await ultimaVersaoAnalise(dados.registroId)) + 1;
  exigir(
    await db().from("analises").insert({
      id,
      registro_id: dados.registroId,
      tipo: dados.tipo,
      versao,
      pontos_positivos: dados.pontosPositivos,
      pontos_atencao: dados.pontosAtencao,
      sugestoes: dados.sugestoes,
      observacoes_adicionais: dados.observacoesAdicionais,
    }),
  );
  if (dados.capacidadeIds.length === 0) return;
  const { error } = await db()
    .from("analise_capacidades")
    .insert(
      dados.capacidadeIds.map((capacidadeId) => ({
        analise_id: id,
        capacidade_id: capacidadeId,
      })),
    );
  if (error) {
    await db().from("analises").delete().eq("id", id);
    throw new Error(`Banco: ${error.message}`);
  }
}

const limpar = (arr: string[]) => arr.map((s) => s.trim()).filter(Boolean);

// Dispara a análise da IA e salva a versão original (IA_ORIGINAL).
export async function analisarRegistro(
  registroId: string,
): Promise<AnaliseActionState> {
  const registro = await carregarRegistroDoDono(registroId);
  if (!registro) return { error: "Registro inválido ou sem permissão." };

  const capacidades = registro.capacidades;
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

  await salvarAnalise({
    registroId,
    tipo: "IA_ORIGINAL",
    pontosPositivos: resultado.pontosPositivos,
    pontosAtencao: resultado.pontosAtencao,
    sugestoes: resultado.sugestoes,
    observacoesAdicionais: resultado.observacoesAdicionais ?? null,
    capacidadeIds: resultado.capacidadeIds,
  });

  revalidatePath(`/turmas/${registro.turmaId}/registros/${registroId}`, "layout");
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

  const validas = new Set(registro.capacidades.map((c) => c.id));
  const capacidadeIds = input.capacidadeIds.filter((id) => validas.has(id));

  await salvarAnalise({
    registroId: input.registroId,
    tipo: "VALIDADA",
    pontosPositivos: limpar(input.pontosPositivos),
    pontosAtencao: limpar(input.pontosAtencao),
    sugestoes: limpar(input.sugestoes),
    observacoesAdicionais: input.observacoesAdicionais?.trim() || null,
    capacidadeIds,
  });

  revalidatePath(`/turmas/${registro.turmaId}/registros/${input.registroId}`, "layout");
  return { ok: true };
}
