import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";

export default async function TurmasPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const turmas = await prisma.turma.findMany({
    where: { professorId: profile.id },
    include: {
      curso: true,
      _count: { select: { capacidades: true, registros: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Minhas turmas</h1>
        </div>
        <Link href="/turmas/nova" className={buttonVariants()}>
          Nova turma
        </Link>
      </header>

      {turmas.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Você ainda não cadastrou nenhuma turma.
          </p>
          <Link
            href="/turmas/nova"
            className={buttonVariants({ className: "mt-4" })}
          >
            Cadastrar primeira turma
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {turmas.map((turma) => (
            <li key={turma.id}>
              <Link
                href={`/turmas/${turma.id}`}
                className="block rounded-xl border bg-card p-4 transition hover:bg-accent"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{turma.nome}</p>
                    <p className="text-sm text-muted-foreground">{turma.curso.nome}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{turma._count.capacidades} capacidades</p>
                    <p>{turma._count.registros} registros</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
