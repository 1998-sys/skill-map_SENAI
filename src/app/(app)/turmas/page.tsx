import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import {
  listarTurmasDoProfessor,
} from "@/lib/db/consultas";
import { FolderOpen, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { formatarDiaDoInstante } from "@/lib/datas";

export default async function TurmasPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const todas = await listarTurmasDoProfessor(profile.id);
  const turmas = todas.filter((t) => !t.finalizadaEm);
  const finalizadas = todas.filter((t) => t.finalizadaEm);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      <SectionCard
        title="Minhas turmas"
        description="Escolha uma turma para ver as capacidades, registrar aulas e consultar o histórico."
        action={
          <Link href="/turmas/nova" className={buttonVariants({ size: "lg" })}>
            <Plus /> Nova turma
          </Link>
        }
      >
        {turmas.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <p className="text-sm text-muted-foreground">
              {finalizadas.length > 0
                ? "Nenhuma turma em andamento."
                : "Você ainda não cadastrou nenhuma turma."}
            </p>
            <Link
              href="/turmas/nova"
              className={buttonVariants({ size: "lg", className: "mt-4" })}
            >
              <Plus /> {finalizadas.length > 0 ? "Nova turma" : "Cadastrar primeira turma"}
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-surface-strong text-left text-title">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Turma / Curso</th>
                  <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">
                    Capacidades
                  </th>
                  <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">
                    Registros
                  </th>
                  <th className="w-px px-4 py-2.5 font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {turmas.map((turma) => (
                  <tr key={turma.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{turma.nome}</p>
                      <p className="text-xs text-muted-foreground">{turma.curso.nome}</p>
                    </td>
                    <td className="hidden px-4 py-3 tabular-nums sm:table-cell">
                      {turma.totalCapacidades}
                    </td>
                    <td className="hidden px-4 py-3 tabular-nums sm:table-cell">
                      {turma.totalRegistros}
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/turmas/${turma.id}`}
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

      {finalizadas.length > 0 && (
        <SectionCard
          title="Turmas finalizadas"
          description="Cursos encerrados: ficam só para consulta do histórico."
        >
          <ul className="divide-y rounded-lg border">
            {finalizadas.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/turmas/${t.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted"
                >
                  <span className="min-w-0">
                    <span className="block font-medium">{t.nome}</span>
                    <span className="block text-xs text-muted-foreground">{t.curso.nome}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {t.totalRegistros} {t.totalRegistros === 1 ? "registro" : "registros"} ·
                    finalizada em {t.finalizadaEm ? formatarDiaDoInstante(t.finalizadaEm) : "—"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </main>
  );
}
