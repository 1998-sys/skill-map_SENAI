"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { agora, db, exigir } from "@/lib/db/cliente";
import { buscarRegistro } from "@/lib/db/consultas";
import { getCurrentProfile } from "@/lib/auth";

export type EnvioState = { error?: string; ok?: boolean };

// Envia o registro do dia à Coordenação. Só é permitido depois de haver uma
// análise validada pelo professor. Registra data/hora do envio.
export async function enviarParaCoordenacao(
  registroId: string,
): Promise<EnvioState> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const registro = await buscarRegistro(registroId);
  if (!registro || registro.professorId !== profile.id) {
    return { error: "Registro inválido ou sem permissão." };
  }
  if (registro.status === "ENVIADO") {
    return { error: "Este registro já foi enviado à Coordenação." };
  }

  const { count: validadas, error } = await db()
    .from("analises")
    .select("id", { count: "exact", head: true })
    .eq("registro_id", registroId)
    .eq("tipo", "VALIDADA");
  if (error) throw new Error(`Banco: ${error.message}`);
  if (!validadas) {
    return { error: "Valide a análise antes de enviar à Coordenação." };
  }

  const momento = agora();
  exigir(
    await db()
      .from("registros")
      .update({ status: "ENVIADO", enviado_em: momento, updated_at: momento })
      .eq("id", registroId),
  );

  revalidatePath(`/turmas/${registro.turmaId}/registros/${registroId}`, "layout");
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

  const registro = await buscarRegistro(registroId);
  if (!registro || registro.professorId !== profile.id) {
    return { error: "Registro inválido ou sem permissão." };
  }

  exigir(
    await db()
      .from("registros")
      .update({ status: "RASCUNHO", updated_at: agora() })
      .eq("id", registroId),
  );

  revalidatePath(`/turmas/${registro.turmaId}/registros/${registroId}`, "layout");
  revalidatePath(`/turmas/${registro.turmaId}`);
  return { ok: true };
}
