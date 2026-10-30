import Link from "next/link";
import { House } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { TitleAccent } from "@/components/ui/section-card";

// Página "não encontrado" (404) em português, no padrão visual SENAI.
// Aparece quando a turma/registro não existe, foi excluído pela Coordenação,
// ou o usuário não tem acesso a ele.
export function NaoEncontrado() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 items-center p-4 sm:p-6">
      <section className="w-full rounded-xl border bg-card p-6 text-center sm:p-8">
        <p className="text-5xl font-extrabold tracking-tight text-primary">404</p>
        <h1 className="mt-3 text-xl font-extrabold tracking-tight text-title sm:text-2xl">
          Página não encontrada
        </h1>
        <TitleAccent className="mx-auto" />
        <p className="mt-4 text-sm text-muted-foreground">
          Esta turma ou registro não existe, foi excluído pela Coordenação ou
          você não tem acesso a ele.
        </p>
        <Link
          href="/dashboard"
          className={buttonVariants({ size: "lg", className: "mt-6" })}
        >
          <House /> Voltar ao início
        </Link>
      </section>
    </main>
  );
}
