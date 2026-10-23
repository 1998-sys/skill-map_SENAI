import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateRegistro } from "@/lib/actions/registros";
import { Button } from "@/components/ui/button";
import { RegistroForm } from "../registro-form";

function formatarData(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(d);
}

export default async function RegistroPage({
  params,
}: {
  params: Promise<{ id: string; registroId: string }>;
}) {
  const { id, registroId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const registro = await prisma.registro.findUnique({
    where: { id: registroId },
    include: { turma: { select: { id: true, nome: true, professorId: true } } },
  });

  if (
    !registro ||
    registro.turma.id !== id ||
    registro.turma.professorId !== profile.id
  ) {
    notFound();
  }

  const isRascunho = registro.status === "RASCUNHO";

  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <div className="mb-6">
        <Link
          href={`/turmas/${registro.turma.id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← {registro.turma.nome}
        </Link>
        <div className="mt-2 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">
            Registro de {formatarData(registro.data)}
          </h1>
          <span
            className={
              isRascunho
                ? "rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                : "rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700"
            }
          >
            {isRascunho ? "Rascunho" : "Enviado à Coordenação"}
          </span>
        </div>
        {registro.tema && (
          <p className="text-sm text-muted-foreground">Tema: {registro.tema}</p>
        )}
      </div>

      <RegistroForm
        action={updateRegistro}
        hidden={{ registroId: registro.id }}
        defaults={{
          data: registro.data.toISOString().slice(0, 10),
          tema: registro.tema ?? "",
          textoTrabalhado: registro.textoTrabalhado,
          textoDesempenho: registro.textoDesempenho,
          textoObservacoes: registro.textoObservacoes ?? "",
        }}
        submitLabel="Salvar alterações"
        readOnly={!isRascunho}
      />

      <section className="mt-8 rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium">Análise pedagógica com IA</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A IA vai relacionar este relato às capacidades da turma e sugerir
              ações. Chega na próxima etapa.
            </p>
          </div>
          <Button disabled title="Disponível na Etapa 3">
            Analisar com IA
          </Button>
        </div>
      </section>
    </main>
  );
}
