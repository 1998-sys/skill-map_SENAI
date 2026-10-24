import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Atalho "Análise da IA" do submenu da turma: abre a análise do registro mais
// recente que já tem análise; sem nenhuma, o registro mais recente (onde se
// pode analisar); sem registros, um novo Registro Diário.
export default async function AnaliseDaTurmaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const turma = await prisma.turma.findUnique({
    where: { id },
    select: { professorId: true },
  });
  if (!turma || turma.professorId !== profile.id) notFound();

  const comAnalise = await prisma.registro.findFirst({
    where: { turmaId: id, analises: { some: {} } },
    orderBy: { data: "desc" },
    select: { id: true },
  });
  if (comAnalise) redirect(`/turmas/${id}/registros/${comAnalise.id}/analise`);

  const ultimo = await prisma.registro.findFirst({
    where: { turmaId: id },
    orderBy: { data: "desc" },
    select: { id: true },
  });
  if (ultimo) redirect(`/turmas/${id}/registros/${ultimo.id}`);

  redirect(`/turmas/${id}/registros/novo`);
}
