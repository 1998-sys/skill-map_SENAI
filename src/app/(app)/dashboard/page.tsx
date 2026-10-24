import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ClipboardList, Users } from "lucide-react";
import { getCurrentUser, getCurrentProfile } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { PageNote } from "@/components/ui/info-field";

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
    <main className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Olá, {nome}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{ROLE_LABEL[role] ?? role}</p>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        <AtalhoCard
          icon={<Users className="size-5" />}
          titulo="Minhas turmas"
          texto="Configure a turma e cadastre as capacidades do curso. Depois, registre as aulas e deixe a IA relacionar aos objetivos de aprendizagem."
          href="/turmas"
          acao="Acessar turmas"
        />
        {role === "COORDENACAO" && (
          <AtalhoCard
            icon={<ClipboardList className="size-5" />}
            titulo="Coordenação"
            texto="Veja o acompanhamento consolidado das turmas, calculado apenas sobre os registros enviados pelos professores."
            href="/coordenacao"
            acao="Painel da Coordenação"
          />
        )}
      </div>

      <PageNote>
        O SkillMap é uma camada de acompanhamento pedagógico: a IA apoia, mas não
        substitui avaliação, nota ou frequência.
      </PageNote>
    </main>
  );
}

function AtalhoCard({
  icon,
  titulo,
  texto,
  href,
  acao,
}: {
  icon: React.ReactNode;
  titulo: string;
  texto: string;
  href: string;
  acao: string;
}) {
  return (
    <section className="flex flex-col rounded-xl border bg-card p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-primary-hover">
          {icon}
        </span>
        <h2 className="text-xl font-extrabold tracking-tight">{titulo}</h2>
      </div>
      <p className="mt-3 flex-1 text-sm text-muted-foreground">{texto}</p>
      <Link
        href={href}
        className={buttonVariants({ size: "lg", className: "mt-4 self-start px-4" })}
      >
        {acao} <ArrowRight />
      </Link>
    </section>
  );
}
