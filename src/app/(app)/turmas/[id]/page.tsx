import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { CapacidadesEditor } from "./capacidades-editor";

function formatarData(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(d);
}

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
    <main className="mx-auto w-full max-w-3xl p-6">
      <div className="mb-6">
        <Link href="/turmas" className="text-sm text-muted-foreground hover:underline">
          ← Minhas turmas
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{turma.nome}</h1>
        <p className="text-sm text-muted-foreground">{turma.curso.nome}</p>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <span>Professor: {turma.professor.nome}</span>
          {turma.periodo && <span>Período: {turma.periodo}</span>}
          {turma.cargaHoraria != null && <span>Carga: {turma.cargaHoraria}h</span>}
        </div>
      </div>

      <section className="rounded-xl border bg-card p-5">
        <CapacidadesEditor turmaId={turma.id} capacidades={turma.capacidades} />
      </section>

      <section className="mt-6 rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">
            Registros{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({turma.registros.length})
            </span>
          </h2>
          <div className="flex gap-2">
            <Link
              href={`/turmas/${turma.id}/historico`}
              className={buttonVariants({ variant: "outline" })}
            >
              Ver histórico
            </Link>
            <Link
              href={`/turmas/${turma.id}/registros/novo`}
              className={buttonVariants()}
            >
              Novo registro
            </Link>
          </div>
        </div>

        {turma.registros.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Nenhum registro ainda. Registre a próxima aula para começar a memória
            pedagógica da turma.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {turma.registros.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/turmas/${turma.id}/registros/${r.id}`}
                  className="flex items-center justify-between gap-4 rounded-lg border p-3 transition hover:bg-accent"
                >
                  <div>
                    <p className="text-sm font-medium">{formatarData(r.data)}</p>
                    {r.tema && (
                      <p className="text-xs text-muted-foreground">{r.tema}</p>
                    )}
                  </div>
                  <StatusBadge status={r.status} short />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
