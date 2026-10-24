import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentProfile } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";

const ROLE_LABEL: Record<string, string> = {
  PROFESSOR: "Professor",
  COORDENACAO: "Coordenação",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getCurrentProfile();
  const nome = profile?.nome ?? user.email;
  const role = profile?.role ?? "PROFESSOR";

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Olá, {nome}</h1>
        <p className="text-sm text-muted-foreground">{ROLE_LABEL[role] ?? role}</p>
      </header>

      <section className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-medium">Minhas turmas</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Configure a turma e cadastre as capacidades do curso. Depois, registre
          as aulas e deixe a IA relacionar aos objetivos de aprendizagem.
        </p>
        <Link href="/turmas" className={buttonVariants({ className: "mt-4" })}>
          Acessar turmas
        </Link>
      </section>

      {role === "COORDENACAO" && (
        <section className="mt-4 rounded-xl border bg-card p-6">
          <h2 className="text-lg font-medium">Coordenação</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Veja o acompanhamento consolidado das turmas, calculado apenas sobre
            os registros enviados pelos professores.
          </p>
          <Link
            href="/coordenacao"
            className={buttonVariants({ className: "mt-4" })}
          >
            Painel da Coordenação
          </Link>
        </section>
      )}
    </main>
  );
}
