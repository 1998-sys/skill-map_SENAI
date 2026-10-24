import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PageNote } from "@/components/ui/info-field";
import { TurmaForm } from "./turma-form";

export default async function NovaTurmaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      <Link href="/turmas" className="text-sm text-muted-foreground hover:underline">
        ← Minhas turmas
      </Link>
      <TurmaForm />
      <PageNote>
        As capacidades são cadastradas uma única vez pelo professor, com base no
        Plano de Curso.
      </PageNote>
    </main>
  );
}
