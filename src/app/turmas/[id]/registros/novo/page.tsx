import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRegistro } from "@/lib/actions/registros";
import { RegistroForm } from "../registro-form";

export default async function NovoRegistroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const turma = await prisma.turma.findUnique({
    where: { id },
    select: { id: true, nome: true, professorId: true },
  });
  if (!turma || turma.professorId !== profile.id) notFound();

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <div className="mb-6">
        <Link
          href={`/turmas/${turma.id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← {turma.nome}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Novo registro</h1>
        <p className="text-sm text-muted-foreground">
          Ao final da aula, relate em linguagem natural o que foi trabalhado e o
          que você observou.
        </p>
      </div>

      <RegistroForm
        action={createRegistro}
        hidden={{ turmaId: turma.id }}
        defaults={{ data: hoje }}
        submitLabel="Salvar registro"
      />
    </main>
  );
}
