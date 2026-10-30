import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import {
  buscarTurma,
} from "@/lib/db/consultas";
import { createRegistro } from "@/lib/actions/registros";
import { PageNote } from "@/components/ui/info-field";
import { RegistroForm } from "../registro-form";

export default async function NovoRegistroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const turma = await buscarTurma(id);
  if (!turma || turma.professorId !== profile.id) notFound();

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      <Link
        href={`/turmas/${turma.id}`}
        className="text-sm text-muted-foreground hover:underline"
      >
        ← {turma.nome}
      </Link>

      <RegistroForm
        action={createRegistro}
        hidden={{ turmaId: turma.id }}
        contexto={{
          curso: turma.curso.nome,
          turma: turma.nome,
          professor: turma.professor.nome,
        }}
        defaults={{ data: hoje }}
        submitLabel="Salvar rascunho"
      />

      <PageNote>
        O professor registra apenas o que observou na aula; ao clicar em
        &quot;Analisar com IA&quot;, a IA cruza essas informações com as capacidades do curso.
      </PageNote>
    </main>
  );
}
