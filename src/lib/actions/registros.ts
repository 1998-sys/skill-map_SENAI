"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { agora, db, exigir, novoId } from "@/lib/db/cliente";
import { buscarRegistro, buscarTurma } from "@/lib/db/consultas";
import { getCurrentProfile } from "@/lib/auth";

export type RegistroFormState = { error?: string; ok?: boolean };

type CamposRegistro = {
  data: string; // "AAAA-MM-DD" (coluna `date` do banco)
  tema: string | null;
  textoTrabalhado: string;
  textoDesempenho: string;
  textoObservacoes: string | null;
};

// Extrai e valida os campos do formulário de registro.
function parseRegistro(
  formData: FormData,
): { ok: true; campos: CamposRegistro } | { ok: false; error: string } {
  const dataStr = String(formData.get("data") ?? "").trim();
  const tema = String(formData.get("tema") ?? "").trim() || null;
  const textoTrabalhado = String(formData.get("textoTrabalhado") ?? "").trim();
  const textoDesempenho = String(formData.get("textoDesempenho") ?? "").trim();
  const textoObservacoes =
    String(formData.get("textoObservacoes") ?? "").trim() || null;

  if (!textoTrabalhado) {
    return { ok: false, error: "Descreva ao menos o que foi trabalhado na aula." };
  }
  const data = dataStr || new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || Number.isNaN(Date.parse(data))) {
    return { ok: false, error: "Data inválida." };
  }
  return {
    ok: true,
    campos: { data, tema, textoTrabalhado, textoDesempenho, textoObservacoes },
  };
}

// Campos do formulário → nomes das colunas no banco (snake_case).
function colunas(c: CamposRegistro) {
  return {
    data: c.data,
    tema: c.tema,
    texto_trabalhado: c.textoTrabalhado,
    texto_desempenho: c.textoDesempenho,
    texto_observacoes: c.textoObservacoes,
  };
}

// Para onde ir depois de salvar, conforme o botão usado no formulário:
// "analisar" → tela da Análise já gerando com a IA; "ver" → tela da Análise.
function destinoAposSalvar(formData: FormData, base: string): string | null {
  const intent = String(formData.get("intent") ?? "");
  if (intent === "analisar") return `${base}/analise?gerar=1`;
  if (intent === "ver") return `${base}/analise`;
  return null;
}

// Cria um registro diário (status inicial: RASCUNHO) e abre a tela do registro
// (ou a da Análise, se o professor clicou em "Analisar com IA").
export async function createRegistro(
  _prev: RegistroFormState,
  formData: FormData,
): Promise<RegistroFormState> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const turmaId = String(formData.get("turmaId") ?? "");
  const turma = await buscarTurma(turmaId);
  if (!turma || turma.professorId !== profile.id) {
    return { error: "Turma inválida ou sem permissão." };
  }

  const parsed = parseRegistro(formData);
  if (!parsed.ok) return { error: parsed.error };

  const registro = { id: novoId() };
  exigir(
    await db()
      .from("registros")
      .insert({
        id: registro.id,
        turma_id: turmaId,
        professor_id: profile.id,
        status: "RASCUNHO",
        updated_at: agora(),
        ...colunas(parsed.campos),
      }),
  );

  revalidatePath(`/turmas/${turmaId}`);
  const base = `/turmas/${turmaId}/registros/${registro.id}`;
  redirect(destinoAposSalvar(formData, base) ?? base);
}

// Atualiza um registro enquanto ele ainda é RASCUNHO.
export async function updateRegistro(
  _prev: RegistroFormState,
  formData: FormData,
): Promise<RegistroFormState> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const registroId = String(formData.get("registroId") ?? "");
  const registro = await buscarRegistro(registroId);
  if (!registro || registro.professorId !== profile.id) {
    return { error: "Registro inválido ou sem permissão." };
  }
  if (registro.status !== "RASCUNHO") {
    return { error: "Registro já enviado não pode ser editado." };
  }

  const parsed = parseRegistro(formData);
  if (!parsed.ok) return { error: parsed.error };

  exigir(
    await db()
      .from("registros")
      .update({ ...colunas(parsed.campos), updated_at: agora() })
      .eq("id", registroId),
  );

  const base = `/turmas/${registro.turmaId}/registros/${registroId}`;
  revalidatePath(base, "layout");
  const destino = destinoAposSalvar(formData, base);
  if (destino) redirect(destino);
  return { ok: true };
}
