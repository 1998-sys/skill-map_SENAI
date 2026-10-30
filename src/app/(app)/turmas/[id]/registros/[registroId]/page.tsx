import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChartColumn } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import {
  buscarRegistro,
  contarAnalises,
} from "@/lib/db/consultas";
import { updateRegistro } from "@/lib/actions/registros";
import { RegistroForm } from "../registro-form";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageNote } from "@/components/ui/info-field";
import { formatarData, formatarDataHora } from "@/lib/datas";

// Registro Diário (spec, tela 4) de um registro existente. A análise da IA
// fica na tela própria: ./analise.
export default async function RegistroPage({
  params,
}: {
  params: Promise<{ id: string; registroId: string }>;
}) {
  const { id, registroId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const registro = await buscarRegistro(registroId);

  if (
    !registro ||
    registro.turma.id !== id ||
    registro.turma.professorId !== profile.id
  ) {
    notFound();
  }

  const isRascunho = registro.status === "RASCUNHO";
  const temAnalise = (await contarAnalises(registro.id)) > 0;
  const urlAnalise = `/turmas/${registro.turma.id}/registros/${registro.id}/analise`;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href={`/turmas/${registro.turma.id}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            ← {registro.turma.nome}
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight">
              Registro de {formatarData(registro.data)}
            </h1>
            <StatusBadge status={registro.status} />
          </div>
          {!isRascunho && registro.enviadoEm && (
            <p className="mt-1 text-sm font-medium text-primary-active">
              Enviado à Coordenação em {formatarDataHora(registro.enviadoEm)}
            </p>
          )}
        </div>
        {temAnalise && (
          <Link
            href={urlAnalise}
            className={buttonVariants({ variant: "outline-primary", size: "lg" })}
          >
            <ChartColumn /> Ver análise da IA
          </Link>
        )}
      </div>

      <RegistroForm
        action={updateRegistro}
        hidden={{ registroId: registro.id }}
        contexto={{
          curso: registro.turma.curso.nome,
          turma: registro.turma.nome,
          professor: registro.turma.professor.nome,
        }}
        defaults={{
          data: registro.data.toISOString().slice(0, 10),
          tema: registro.tema ?? "",
          textoTrabalhado: registro.textoTrabalhado,
          textoDesempenho: registro.textoDesempenho,
          textoObservacoes: registro.textoObservacoes ?? "",
        }}
        submitLabel="Salvar alterações"
        readOnly={!isRascunho}
        temAnalise={temAnalise}
      />

      <PageNote>
        O professor registra apenas o que observou na aula; a IA cruza essas
        informações com as capacidades do curso na tela de Análise.
      </PageNote>
    </main>
  );
}
