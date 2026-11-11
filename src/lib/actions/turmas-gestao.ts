"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { agora, db, exigir } from "@/lib/db/cliente";
import { buscarTurma } from "@/lib/db/consultas";
import { listarResponsaveis } from "@/lib/db/usuarios";
import { getCurrentProfile } from "@/lib/auth";

// Gestão da turma: finalizar (fim do curso), reabrir e realocar professor.
// Permissões checadas aqui no servidor:
//   - finalizar: o professor responsável ou a Coordenação;
//   - reabrir e realocar: só a Coordenação.

export type GestaoState = { error?: string; ok?: boolean };

function atualizarTelas(turmaId: string) {
  revalidatePath("/turmas");
  revalidatePath(`/turmas/${turmaId}`, "layout");
  revalidatePath(`/coordenacao/turmas/${turmaId}`);
  revalidatePath("/coordenacao/acompanhamento");
  revalidatePath("/coordenacao/dashboard");
}

export async function finalizarTurma(turmaId: string): Promise<GestaoState> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const turma = await buscarTurma(turmaId);
  if (!turma) return { error: "Turma não encontrada." };
  if (turma.professorId !== profile.id && profile.role !== "COORDENACAO") {
    return { error: "Só o professor responsável ou a Coordenação podem finalizar a turma." };
  }
  if (turma.finalizadaEm) return { error: "Esta turma já está finalizada." };

  exigir(
    await db()
      .from("turmas")
      .update({ finalizada_em: agora(), finalizada_por: profile.id, updated_at: agora() })
      .eq("id", turmaId),
  );
  atualizarTelas(turmaId);
  return { ok: true };
}

export async function reabrirTurma(turmaId: string): Promise<GestaoState> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "COORDENACAO") return { error: "Só a Coordenação pode reabrir a turma." };
  const turma = await buscarTurma(turmaId);
  if (!turma) return { error: "Turma não encontrada." };

  exigir(
    await db()
      .from("turmas")
      .update({ finalizada_em: null, finalizada_por: null, updated_at: agora() })
      .eq("id", turmaId),
  );
  atualizarTelas(turmaId);
  return { ok: true };
}

// Passa a turma (com registros, rascunhos e histórico) para outro professor.
// Os registros continuam com o autor original; quem edita daqui em diante é
// o novo responsável.
export async function realocarTurma(
  _prev: GestaoState,
  formData: FormData,
): Promise<GestaoState> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "COORDENACAO") return { error: "Só a Coordenação pode realocar a turma." };

  const turmaId = String(formData.get("turmaId") ?? "");
  const professorId = String(formData.get("professorId") ?? "");
  const turma = await buscarTurma(turmaId);
  if (!turma) return { error: "Turma não encontrada." };
  if (professorId === turma.professorId) {
    return { error: "Escolha um professor diferente do atual." };
  }
  const alvo = (await listarResponsaveis()).find((u) => u.id === professorId);
  if (!alvo) return { error: "Escolha um professor com acesso ativo." };

  exigir(
    await db()
      .from("turmas")
      .update({ professor_id: alvo.id, updated_at: agora() })
      .eq("id", turmaId),
  );
  atualizarTelas(turmaId);
  return { ok: true };
}
