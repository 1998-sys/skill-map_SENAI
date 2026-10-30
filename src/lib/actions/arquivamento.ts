"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth";
import { agora, db, exigir } from "@/lib/db/cliente";

// Exclusão de turmas e registros pela COORDENAÇÃO — e só por ela.
//
// "Excluir" aqui é ARQUIVAR (exclusão lógica): preenche excluido_em e
// excluido_por. Some de todas as telas (professor e Coordenação), mas fica
// no banco — a spec exige rastreabilidade — e pode ser restaurado na tela
// /coordenacao/excluidos.

export type ArquivamentoState = { error?: string; ok?: boolean };

const SEM_PERMISSAO: ArquivamentoState = {
  error: "Somente a Coordenação pode excluir ou restaurar turmas e registros.",
};

// A regra de papel fica AQUI, no servidor. Esconder o botão não basta: uma
// Server Action pode ser chamada direto, sem passar pela tela.
async function exigirCoordenacao() {
  const profile = await getCurrentProfile();
  return profile?.role === "COORDENACAO" ? profile : null;
}

// Arquivar/restaurar muda várias telas (listas, painéis, contagens).
function revalidarTudo() {
  revalidatePath("/", "layout");
}

// Arquiva a turma e, com o MESMO instante, todos os registros ativos dela.
// O instante igual é o que permite restaurar exatamente esses registros.
export async function arquivarTurma(turmaId: string): Promise<ArquivamentoState> {
  const profile = await exigirCoordenacao();
  if (!profile) return SEM_PERMISSAO;

  const momento = agora();
  const marca = { excluido_em: momento, excluido_por: profile.id, updated_at: momento };

  const turmas = exigir<{ id: string }[]>(
    await db()
      .from("turmas")
      .update(marca)
      .eq("id", turmaId)
      .is("excluido_em", null)
      .select("id"),
  );
  if (turmas.length === 0) return { error: "Turma não encontrada ou já excluída." };

  const { error } = await db()
    .from("registros")
    .update(marca)
    .eq("turma_id", turmaId)
    .is("excluido_em", null);
  if (error) {
    // Desfaz o arquivamento da turma para não ficar pela metade.
    await db()
      .from("turmas")
      .update({ excluido_em: null, excluido_por: null })
      .eq("id", turmaId);
    return { error: `Banco: ${error.message}` };
  }

  revalidarTudo();
  return { ok: true };
}

export async function arquivarRegistro(registroId: string): Promise<ArquivamentoState> {
  const profile = await exigirCoordenacao();
  if (!profile) return SEM_PERMISSAO;

  const momento = agora();
  const linhas = exigir<{ id: string }[]>(
    await db()
      .from("registros")
      .update({ excluido_em: momento, excluido_por: profile.id, updated_at: momento })
      .eq("id", registroId)
      .is("excluido_em", null)
      .select("id"),
  );
  if (linhas.length === 0) return { error: "Registro não encontrado ou já excluído." };

  revalidarTudo();
  return { ok: true };
}

// Restaura a turma e os registros que foram arquivados JUNTO com ela
// (mesmo instante). Registros excluídos um a um antes continuam arquivados.
export async function restaurarTurma(turmaId: string): Promise<ArquivamentoState> {
  const profile = await exigirCoordenacao();
  if (!profile) return SEM_PERMISSAO;

  const turma = exigir<{ excluido_em: string | null } | null>(
    await db().from("turmas").select("excluido_em").eq("id", turmaId).maybeSingle(),
  );
  if (!turma?.excluido_em) return { error: "Turma não encontrada ou não está excluída." };

  const limpa = { excluido_em: null, excluido_por: null, updated_at: agora() };
  exigir(
    await db()
      .from("registros")
      .update(limpa)
      .eq("turma_id", turmaId)
      .eq("excluido_em", turma.excluido_em),
  );
  exigir(await db().from("turmas").update(limpa).eq("id", turmaId));

  revalidarTudo();
  return { ok: true };
}

export async function restaurarRegistro(registroId: string): Promise<ArquivamentoState> {
  const profile = await exigirCoordenacao();
  if (!profile) return SEM_PERMISSAO;

  const registro = exigir<{
    excluido_em: string | null;
    turma: { excluido_em: string | null };
  } | null>(
    await db()
      .from("registros")
      .select("excluido_em, turma:turmas(excluido_em)")
      .eq("id", registroId)
      .maybeSingle(),
  );
  if (!registro?.excluido_em) {
    return { error: "Registro não encontrado ou não está excluído." };
  }
  if (registro.turma.excluido_em) {
    return { error: "A turma deste registro está excluída. Restaure a turma primeiro." };
  }

  exigir(
    await db()
      .from("registros")
      .update({ excluido_em: null, excluido_por: null, updated_at: agora() })
      .eq("id", registroId),
  );

  revalidarTudo();
  return { ok: true };
}
