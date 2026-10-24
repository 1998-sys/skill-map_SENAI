import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FolderOpen, History, Plus } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { SectionCard } from "@/components/ui/section-card";
import { InfoField, PageNote } from "@/components/ui/info-field";
import { formatarData } from "@/lib/datas";
import { CapacidadesEditor } from "./capacidades-editor";

export default async function TurmaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const turma = await prisma.turma.findUnique({
    where: { id },
    include: {
      curso: true,
      professor: { select: { nome: true } },
      capacidades: { orderBy: { ordem: "asc" }, select: { id: true, texto: true } },
      registros: {
        orderBy: { data: "desc" },
        select: { id: true, data: true, tema: true, status: true },
      },
    },
  });

  if (!turma || turma.professorId !== profile.id) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      <Link href="/turmas" className="text-sm text-muted-foreground hover:underline">
        ← Minhas turmas
      </Link>

      <SectionCard title="Dados da Turma">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1.2fr_2fr_1fr_1fr]">
          <InfoField label="Curso" value={turma.curso.nome} />
          <InfoField label="Turma" value={turma.nome} />
          <InfoField label="Professor" value={turma.professor.nome} />
          <InfoField label="Período" value={turma.periodo} />
          <InfoField
            label="Carga horária"
            value={turma.cargaHoraria != null ? `${turma.cargaHoraria}h` : null}
          />
        </div>
      </SectionCard>

      <SectionCard>
        <CapacidadesEditor turmaId={turma.id} capacidades={turma.capacidades} />
      </SectionCard>

      <SectionCard
        title="Registros da Turma"
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/turmas/${turma.id}/historico`}
              className={buttonVariants({ variant: "outline-primary", size: "lg" })}
            >
              <History /> Ver histórico
            </Link>
            <Link
              href={`/turmas/${turma.id}/registros/novo`}
              className={buttonVariants({ size: "lg" })}
            >
              <Plus /> Novo registro de aula
            </Link>
          </div>
        }
      >
        {turma.registros.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum registro ainda. Registre a próxima aula para começar a memória
            pedagógica da turma.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Data</th>
                  <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">
                    Aula / Tema
                  </th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="w-px px-4 py-2.5 font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {turma.registros.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 tabular-nums">{formatarData(r.data)}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {r.tema || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} short />
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/turmas/${turma.id}/registros/${r.id}`}
                        className={buttonVariants({ variant: "outline-primary" })}
                      >
                        <FolderOpen /> Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <PageNote>
        As capacidades são cadastradas uma única vez pelo professor, com base no
        Plano de Curso.
      </PageNote>
    </main>
  );
}
