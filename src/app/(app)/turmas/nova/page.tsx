import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { listarResponsaveis } from "@/lib/db/usuarios";
import { PageNote } from "@/components/ui/info-field";
import { TurmaForm } from "./turma-form";

// A importação de capacidades por PDF chama a IA, que pode levar até 1 minuto.
export const maxDuration = 60;

export default async function NovaTurmaPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  // A Coordenação pode criar a turma já para outro professor.
  const professores =
    profile.role === "COORDENACAO"
      ? (await listarResponsaveis()).map((r) => ({
          id: r.id,
          nome: r.role === "COORDENACAO" ? `${r.nome} (Coordenação)` : r.nome,
        }))
      : null;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      <Link href="/turmas" className="text-sm text-muted-foreground hover:underline">
        ← Minhas turmas
      </Link>
      <TurmaForm professores={professores} meuId={profile.id} />
      <PageNote>
        As capacidades são cadastradas uma única vez pelo professor, com base no
        Plano de Curso.
      </PageNote>
    </main>
  );
}
