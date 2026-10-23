"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/auth";

export type FormState = { error?: string };

// Quebra o texto colado em capacidades individuais (uma por linha não vazia).
function parseCapacidades(texto: string): string[] {
  return texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

// Garante que o usuário atual é o professor dono da turma.
async function requireTurmaOwner(turmaId: string) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const turma = await prisma.turma.findUnique({
    where: { id: turmaId },
    select: { professorId: true },
  });
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

  const turma = await prisma.turma.create({
    data: {
      nome: turmaNome,
      periodo,
      cargaHoraria,
      curso: { create: { nome: cursoNome } },
      professor: { connect: { id: profile.id } },
      capacidades: {
        create: capacidades.map((texto, i) => ({ texto, ordem: i })),
      },
    },
    select: { id: true },
  });

  revalidatePath("/turmas");
  redirect(`/turmas/${turma.id}`);
}

// Adiciona uma capacidade ao final da lista.
export async function addCapacidade(turmaId: string, texto: string) {
  await requireTurmaOwner(turmaId);
  const t = texto.trim();
  if (!t) return;
  const agg = await prisma.capacidade.aggregate({
    where: { turmaId },
    _max: { ordem: true },
  });
  await prisma.capacidade.create({
    data: { turmaId, texto: t, ordem: (agg._max.ordem ?? -1) + 1 },
  });
  revalidatePath(`/turmas/${turmaId}`);
}

// Adiciona várias capacidades de uma vez (colar em bloco).
export async function addCapacidadesEmBloco(turmaId: string, texto: string) {
  await requireTurmaOwner(turmaId);
  const novas = parseCapacidades(texto);
  if (novas.length === 0) return;
  const agg = await prisma.capacidade.aggregate({
    where: { turmaId },
    _max: { ordem: true },
  });
  const base = (agg._max.ordem ?? -1) + 1;
  await prisma.capacidade.createMany({
    data: novas.map((t, i) => ({ turmaId, texto: t, ordem: base + i })),
  });
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
  await prisma.capacidade.update({ where: { id }, data: { texto: t } });
  revalidatePath(`/turmas/${turmaId}`);
}

export async function deleteCapacidade(id: string, turmaId: string) {
  await requireTurmaOwner(turmaId);
  await prisma.capacidade.delete({ where: { id } });
  revalidatePath(`/turmas/${turmaId}`);
}
