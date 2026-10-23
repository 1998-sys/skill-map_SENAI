"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/auth";

export type RegistroFormState = { error?: string; ok?: boolean };

type CamposRegistro = {
  data: Date;
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
  const data = dataStr ? new Date(`${dataStr}T00:00:00`) : new Date();
  if (Number.isNaN(data.getTime())) {
    return { ok: false, error: "Data inválida." };
  }
  return {
    ok: true,
    campos: { data, tema, textoTrabalhado, textoDesempenho, textoObservacoes },
  };
}

// Cria um registro diário (status inicial: RASCUNHO) e abre a tela do registro.
export async function createRegistro(
  _prev: RegistroFormState,
  formData: FormData,
): Promise<RegistroFormState> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const turmaId = String(formData.get("turmaId") ?? "");
  const turma = await prisma.turma.findUnique({
    where: { id: turmaId },
    select: { professorId: true },
  });
  if (!turma || turma.professorId !== profile.id) {
    return { error: "Turma inválida ou sem permissão." };
  }

  const parsed = parseRegistro(formData);
  if (!parsed.ok) return { error: parsed.error };

  const registro = await prisma.registro.create({
    data: {
      turmaId,
      professorId: profile.id,
      status: "RASCUNHO",
      ...parsed.campos,
    },
    select: { id: true },
  });

  revalidatePath(`/turmas/${turmaId}`);
  redirect(`/turmas/${turmaId}/registros/${registro.id}`);
}

// Atualiza um registro enquanto ele ainda é RASCUNHO.
export async function updateRegistro(
  _prev: RegistroFormState,
  formData: FormData,
): Promise<RegistroFormState> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const registroId = String(formData.get("registroId") ?? "");
  const registro = await prisma.registro.findUnique({
    where: { id: registroId },
    select: { professorId: true, status: true, turmaId: true },
  });
  if (!registro || registro.professorId !== profile.id) {
    return { error: "Registro inválido ou sem permissão." };
  }
  if (registro.status !== "RASCUNHO") {
    return { error: "Registro já enviado não pode ser editado." };
  }

  const parsed = parseRegistro(formData);
  if (!parsed.ok) return { error: parsed.error };

  await prisma.registro.update({
    where: { id: registroId },
    data: { ...parsed.campos },
  });

  revalidatePath(`/turmas/${registro.turmaId}/registros/${registroId}`);
  return { ok: true };
}
