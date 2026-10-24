"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/auth";

export type EnvioState = { error?: string; ok?: boolean };

// Envia o registro do dia à Coordenação. Só é permitido depois de haver uma
// análise validada pelo professor. Registra data/hora do envio.
export async function enviarParaCoordenacao(
  registroId: string,
): Promise<EnvioState> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const registro = await prisma.registro.findUnique({
    where: { id: registroId },
    select: { professorId: true, status: true, turmaId: true },
  });
  if (!registro || registro.professorId !== profile.id) {
    return { error: "Registro inválido ou sem permissão." };
  }
  if (registro.status === "ENVIADO") {
    return { error: "Este registro já foi enviado à Coordenação." };
  }

  const validadas = await prisma.analise.count({
    where: { registroId, tipo: "VALIDADA" },
  });
  if (validadas === 0) {
    return { error: "Valide a análise antes de enviar à Coordenação." };
  }

  await prisma.registro.update({
    where: { id: registroId },
    data: { status: "ENVIADO", enviadoEm: new Date() },
  });

  revalidatePath(`/turmas/${registro.turmaId}/registros/${registroId}`);
  revalidatePath(`/turmas/${registro.turmaId}`);
  return { ok: true };
}

// Reabre um registro enviado para correção. Preserva o histórico (as análises
// já salvas continuam no banco); uma nova validação gera nova versão.
export async function reabrirRegistro(
  registroId: string,
): Promise<EnvioState> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const registro = await prisma.registro.findUnique({
    where: { id: registroId },
    select: { professorId: true, turmaId: true },
  });
  if (!registro || registro.professorId !== profile.id) {
    return { error: "Registro inválido ou sem permissão." };
  }

  await prisma.registro.update({
    where: { id: registroId },
    data: { status: "RASCUNHO" },
  });

  revalidatePath(`/turmas/${registro.turmaId}/registros/${registroId}`);
  revalidatePath(`/turmas/${registro.turmaId}`);
  return { ok: true };
}
