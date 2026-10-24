import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { TurmaForm } from "./turma-form";

export default async function NovaTurmaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <div className="mb-6">
        <Link href="/turmas" className="text-sm text-muted-foreground hover:underline">
          ← Voltar para turmas
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Nova turma</h1>
        <p className="text-sm text-muted-foreground">
          Configure a turma uma única vez e informe as capacidades que a IA vai usar.
        </p>
      </div>
      <TurmaForm />
    </main>
  );
}
