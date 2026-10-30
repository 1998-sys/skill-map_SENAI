"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { agora, db, exigir, novoId } from "@/lib/db/cliente";
import { buscarTurma } from "@/lib/db/consultas";
import { getCurrentProfile } from "@/lib/auth";

export type FormState = { error?: string };

// Quebra o texto colado em capacidades individuais (uma por linha não vazia).
function parseCapacidades(texto: string): string[] {
  return texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

// Maior `ordem` já usada nas capacidades da turma (-1 se não houver).
async function maiorOrdem(turmaId: string): Promise<number> {
  const linha = exigir<{ ordem: number } | null>(
    await db()
      .from("capacidades")
      .select("ordem")
      .eq("turma_id", turmaId)
      .order("ordem", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
  return linha?.ordem ?? -1;
}

// Garante que o usuário atual é o professor dono da turma.
async function requireTurmaOwner(turmaId: string) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const turma = await buscarTurma(turmaId);
  if (!turma || turma.professorId !== profile.id) {
    throw new Error("Você não tem permissão para editar esta turma.");
  }
  return profile;
}

// Cria curso + turma + capacidades (cada capacidade como item individual).
export async function createTurma(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const cursoNome = String(formData.get("curso") ?? "").trim();
  const turmaNome = String(formData.get("turma") ?? "").trim();
  const periodo = String(formData.get("periodo") ?? "").trim() || null;
  const cargaRaw = String(formData.get("cargaHoraria") ?? "").trim();
  const cargaHoraria = cargaRaw ? Number.parseInt(cargaRaw, 10) : null;
  const capacidades = parseCapacidades(String(formData.get("capacidades") ?? ""));

  if (!cursoNome || !turmaNome) {
    return { error: "Informe ao menos o nome do curso e da turma." };
  }
  if (cargaRaw && Number.isNaN(cargaHoraria)) {
    return { error: "Carga horária deve ser um número." };
  }

  // O Prisma fazia tudo numa transação ("nested create"). Na Data API são
  // três inserts; se um falhar, desfazemos os anteriores.
  const cursoId = novoId();
  const turmaId = novoId();
  const momento = agora();

  exigir(
    await db()
      .from("cursos")
      .insert({ id: cursoId, nome: cursoNome, updated_at: momento }),
  );
  try {
    exigir(
      await db().from("turmas").insert({
        id: turmaId,
        nome: turmaNome,
        periodo,
        carga_horaria: cargaHoraria,
        curso_id: cursoId,
        professor_id: profile.id,
        updated_at: momento,
      }),
    );
    if (capacidades.length > 0) {
      exigir(
        await db()
          .from("capacidades")
          .insert(
            capacidades.map((texto, i) => ({
              id: novoId(),
              turma_id: turmaId,
              texto,
              ordem: i,
            })),
          ),
      );
    }
  } catch (e) {
    // Desfaz: apagar a turma apaga as capacidades (ON DELETE CASCADE).
    await db().from("turmas").delete().eq("id", turmaId);
    await db().from("cursos").delete().eq("id", cursoId);
    return {
      error: e instanceof Error ? e.message : "Não foi possível criar a turma.",
    };
  }

  revalidatePath("/turmas");
  redirect(`/turmas/${turmaId}`);
}

// Adiciona uma capacidade ao final da lista.
export async function addCapacidade(turmaId: string, texto: string) {
  await requireTurmaOwner(turmaId);
  const t = texto.trim();
  if (!t) return;
  const maxOrdem = await maiorOrdem(turmaId);
  exigir(
    await db()
      .from("capacidades")
      .insert({ id: novoId(), turma_id: turmaId, texto: t, ordem: maxOrdem + 1 }),
  );
  revalidatePath(`/turmas/${turmaId}`);
}

// Adiciona várias capacidades de uma vez (colar em bloco).
export async function addCapacidadesEmBloco(turmaId: string, texto: string) {
  await requireTurmaOwner(turmaId);
  const novas = parseCapacidades(texto);
  if (novas.length === 0) return;
  const maxOrdem = await maiorOrdem(turmaId);
  const base = maxOrdem + 1;
  exigir(
    await db()
      .from("capacidades")
      .insert(
        novas.map((t, i) => ({
          id: novoId(),
          turma_id: turmaId,
          texto: t,
          ordem: base + i,
        })),
      ),
  );
  revalidatePath(`/turmas/${turmaId}`);
}

export async function updateCapacidade(
  id: string,
  turmaId: string,
  texto: string,
) {
  await requireTurmaOwner(turmaId);
  const t = texto.trim();
  if (!t) return;
  // Filtra também pela turma: só altera capacidade da turma verificada acima.
  exigir(
    await db()
      .from("capacidades")
      .update({ texto: t })
      .eq("id", id)
      .eq("turma_id", turmaId),
  );
  revalidatePath(`/turmas/${turmaId}`);
}

export async function deleteCapacidade(id: string, turmaId: string) {
  await requireTurmaOwner(turmaId);
  exigir(
    await db().from("capacidades").delete().eq("id", id).eq("turma_id", turmaId),
  );
  revalidatePath(`/turmas/${turmaId}`);
}
