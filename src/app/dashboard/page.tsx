import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";

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
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">SENAI SkillMap</h1>
          <p className="text-sm text-muted-foreground">
            Olá, {nome} · {ROLE_LABEL[role] ?? role}
          </p>
        </div>
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="outline">
            Sair
          </Button>
        </form>
      </header>

      <section className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-medium">Fundação concluída 🎉</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Autenticação, banco e deploy estão no lugar. As telas do produto
          (Turma/Capacidades, Registro Diário, Análise com IA, Histórico e
          Painel da Coordenação) chegam nas próximas etapas.
        </p>
      </section>
    </main>
  );
}
