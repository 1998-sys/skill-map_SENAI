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

// Corrige os dados básicos da turma (curso, nome, período, carga horária).
// Pode: o professor responsável (enquanto a turma não está finalizada) e a
// Coordenação. O curso é uma linha própria da turma: muda só o nome dele.
export type DadosTurmaState = GestaoState & {
  valores?: { curso: string; turma: string; periodo: string; cargaHoraria: string };
};

export async function atualizarDadosTurma(
  _prev: DadosTurmaState,
  formData: FormData,
): Promise<DadosTurmaState> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const turmaId = String(formData.get("turmaId") ?? "");
  const valores = {
    curso: String(formData.get("curso") ?? "").trim(),
    turma: String(formData.get("turma") ?? "").trim(),
    periodo: String(formData.get("periodo") ?? "").trim(),
    cargaHoraria: String(formData.get("cargaHoraria") ?? "").trim(),
  };

  const turma = await buscarTurma(turmaId);
  if (!turma) return { error: "Turma não encontrada.", valores };
  const coordenacao = profile.role === "COORDENACAO";
  if (!coordenacao && turma.professorId !== profile.id) {
    return { error: "Você não tem permissão para editar esta turma.", valores };
  }
  if (!coordenacao && turma.finalizadaEm) {
    return { error: "Turma finalizada: só consulta. Para reabrir, fale com a Coordenação.", valores };
  }
  if (!valores.curso || !valores.turma) {
    return { error: "Informe o nome do curso e da turma.", valores };
  }
  const carga = valores.cargaHoraria ? Number(valores.cargaHoraria) : null;
  if (carga != null && (!Number.isInteger(carga) || carga < 0)) {
    return { error: "Carga horária deve ser um número inteiro.", valores };
  }

  const linha = exigir<{ curso_id: string } | null>(
    await db().from("turmas").select("curso_id").eq("id", turmaId).maybeSingle(),
  );
  if (!linha) return { error: "Turma não encontrada.", valores };

  const momento = agora();
  exigir(
    await db()
      .from("cursos")
      .update({ nome: valores.curso, updated_at: momento })
      .eq("id", linha.curso_id),
  );
  exigir(
    await db()
      .from("turmas")
      .update({
        nome: valores.turma,
        periodo: valores.periodo || null,
        carga_horaria: carga,
        updated_at: momento,
      })
      .eq("id", turmaId),
  );
  atualizarTelas(turmaId);
  return { ok: true };
}
