import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarPlus, FolderOpen, History, Plus } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import {
  buscarTurma,
  listarCapacidades,
  listarRegistrosDaTurma,
} from "@/lib/db/consultas";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { SectionCard } from "@/components/ui/section-card";
import { InfoField, PageNote } from "@/components/ui/info-field";
import { diaISOEmBrasilia, formatarData } from "@/lib/datas";
import { calcularCobertura, rotuloCurto } from "@/lib/calendario";
import { CapacidadesEditor } from "./capacidades-editor";
import { CalendarioForm } from "./calendario-form";

// A importação de capacidades por PDF chama a IA, que pode levar até 1 minuto.
export const maxDuration = 60;

export default async function TurmaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const dados = await buscarTurma(id);
  if (!dados || dados.professorId !== profile.id) notFound();

  // Três consultas independentes, em paralelo.
  const [capacidades, registros] = await Promise.all([
    listarCapacidades(id),
    listarRegistrosDaTurma(id),
  ]);
  const turma = { ...dados, capacidades, registros };

  // Cobertura do calendário: aulas que já aconteceram × registros feitos.
  const datasAula = turma.datasAula ?? [];
  const cobertura = datasAula.length
    ? calcularCobertura(
        datasAula,
        registros.map((r) => ({ data: r.data.toISOString().slice(0, 10), status: r.status })),
        diaISOEmBrasilia(),
      )
    : null;
  const MAX_PENDENTES = 12;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      <Link href="/turmas" className="text-sm text-muted-foreground hover:underline">
        ← Minhas turmas
      </Link>

      <SectionCard title="Dados da Turma">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1.2fr_2fr_1fr_1fr]">
          <InfoField label="Curso" value={turma.curso.nome} />
          <InfoField label="Turma" value={turma.nome} />
          <InfoField label="Professor" value={turma.professor.nome} />
          <InfoField label="Período" value={turma.periodo} />
          <InfoField
            label="Carga horária"
            value={turma.cargaHoraria != null ? `${turma.cargaHoraria}h` : null}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Calendário da turma"
        description={
          cobertura
            ? "Aulas previstas no calendário e quais delas já têm registro."
            : "Monte o calendário para o SkillMap mostrar as aulas sem registro."
        }
      >
        {cobertura && (
          <div className="mb-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <Indicador rotulo="Aulas previstas" valor={cobertura.previstas} />
              <Indicador rotulo="Já aconteceram" valor={cobertura.ocorridas} />
              <Indicador
                rotulo="Com registro"
                valor={`${cobertura.registradas}${cobertura.percentual != null ? ` (${cobertura.percentual}%)` : ""}`}
                destaque={cobertura.semRegistro.length > 0 ? "warning" : "success"}
              />
              <Indicador rotulo="Enviadas à Coordenação" valor={cobertura.enviadas} />
            </div>

            {cobertura.semRegistro.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-warning">
                  {cobertura.semRegistro.length === 1
                    ? "1 aula sem registro"
                    : `${cobertura.semRegistro.length} aulas sem registro`}
                </p>
                <ul className="flex flex-wrap gap-2">
                  {cobertura.semRegistro.slice(0, MAX_PENDENTES).map((d) => (
                    <li key={d}>
                      <Link
                        href={`/turmas/${turma.id}/registros/novo?data=${d}`}
                        className={buttonVariants({ variant: "outline-primary", size: "sm" })}
                        aria-label={`Registrar a aula de ${rotuloCurto(d)}`}
                      >
                        <CalendarPlus /> {rotuloCurto(d)} · Registrar
                      </Link>
                    </li>
                  ))}
                  {cobertura.semRegistro.length > MAX_PENDENTES && (
                    <li className="self-center text-xs text-muted-foreground">
                      +{cobertura.semRegistro.length - MAX_PENDENTES} mais antigas
                    </li>
                  )}
                </ul>
              </div>
            ) : (
              cobertura.ocorridas > 0 && (
                <p className="text-sm font-medium text-success">
                  Todas as aulas que já aconteceram têm registro.
                </p>
              )
            )}
          </div>
        )}

        <details open={!cobertura} className="group rounded-lg border">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-primary-active hover:bg-muted">
            {cobertura ? "Editar calendário" : "Montar calendário"}
          </summary>
          <div className="border-t p-4">
            <CalendarioForm
              turmaId={turma.id}
              cargaHoraria={turma.cargaHoraria}
              inicial={{
                inicio: turma.dataInicio,
                fim: turma.dataFim,
                diasSemana: turma.diasSemana,
                horasPorDia: turma.horasPorDia,
                datasAula: turma.datasAula,
              }}
            />
          </div>
        </details>
      </SectionCard>

      <SectionCard>
        <CapacidadesEditor turmaId={turma.id} capacidades={turma.capacidades} />
      </SectionCard>

      <SectionCard
        title="Registros da Turma"
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/turmas/${turma.id}/historico`}
              className={buttonVariants({ variant: "outline-primary", size: "lg" })}
            >
              <History /> Ver histórico
            </Link>
            <Link
              href={`/turmas/${turma.id}/registros/novo`}
              className={buttonVariants({ size: "lg" })}
            >
              <Plus /> Novo registro de aula
            </Link>
          </div>
        }
      >
        {turma.registros.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum registro ainda. Registre a próxima aula para começar a memória
            pedagógica da turma.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-surface-strong text-left text-title">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Data</th>
                  <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">
                    Aula / Tema
                  </th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="w-px px-4 py-2.5 font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {turma.registros.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 tabular-nums">{formatarData(r.data)}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {r.tema || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} short />
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/turmas/${turma.id}/registros/${r.id}`}
                        className={buttonVariants({ variant: "outline-primary" })}
                      >
                        <FolderOpen /> Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <PageNote>
        As capacidades são cadastradas uma única vez pelo professor, com base no
        Plano de Curso.
      </PageNote>
    </main>
  );
}

function Indicador({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: number | string;
  destaque?: "warning" | "success";
}) {
  const cor =
    destaque === "warning" ? "text-warning" : destaque === "success" ? "text-success" : "text-title";
  return (
    <div className="rounded-lg bg-muted px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{rotulo}</p>
      <p className={`text-xl font-extrabold tabular-nums ${cor}`}>{valor}</p>
    </div>
  );
}
