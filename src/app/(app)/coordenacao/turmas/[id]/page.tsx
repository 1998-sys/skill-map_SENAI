import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { montarAcompanhamento } from "@/lib/acompanhamento";
import { listarResponsaveis } from "@/lib/db/usuarios";
import { lerInstante } from "@/lib/db/cliente";
import { finalizarTurma, reabrirTurma } from "@/lib/actions/turmas-gestao";
import { RealocarProfessor } from "./realocar-professor";
import { EditarDadosTurma } from "@/components/editar-dados-turma";
import {
  CalendarDays,
  FileText,
  FolderOpen,
  CircleCheck,
  Lightbulb,
  Printer,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SectionCard, TitleAccent } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { InfoField, PageNote } from "@/components/ui/info-field";
import { ResumoIA } from "./resumo-ia";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { arquivarTurma } from "@/lib/actions/arquivamento";
import {
  formatarData,
  formatarDataHora,
  formatarDiaDoInstante,
} from "@/lib/datas";

export const maxDuration = 60;

export default async function CoordenacaoTurmaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "COORDENACAO") redirect("/dashboard");

  const [dados, responsaveis] = await Promise.all([
    montarAcompanhamento(id),
    listarResponsaveis(),
  ]);
  if (!dados) notFound();
  const {
    turma,
    enviados,
    ultimoEnvio,
    pontosPositivos,
    atencaoAgrupada,
    sugestoesAgrupadas,
    conteudo,
    resumoSalvo,
  } = dados;
  const finalizadaEm = lerInstante(turma.finalizadaEm);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      <Link
        href="/coordenacao/acompanhamento"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Acompanhamento
      </Link>

      {finalizadaEm && (
        <p className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-soft px-4 py-3 text-sm font-medium text-success">
          <CircleCheck className="size-4 shrink-0" />
          Turma finalizada em {formatarDataHora(finalizadaEm)}. O professor não registra mais aulas
          nela; a Coordenação pode reabrir em &quot;Gestão da turma&quot;.
        </p>
      )}

      <SectionCard
        title="Acompanhamento da turma"
        action={
          <Link
            href={`/imprimir/turma/${turma.id}`}
            target="_blank"
            className={buttonVariants({ variant: "outline-primary", size: "lg", className: "px-4" })}
          >
            <Printer /> Relatório consolidado
          </Link>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<FileText className="size-5" />}
            label="Registros recebidos"
            value={enviados.length}
          />
          <StatCard
            icon={<CalendarDays className="size-5" />}
            label="Último envio"
            value={ultimoEnvio ? formatarDiaDoInstante(ultimoEnvio) : "—"}
            color="neutral"
          />
          <StatCard
            icon={<TriangleAlert className="size-5" />}
            label="Pontos de atenção"
            value={atencaoAgrupada.length}
            color="warning"
          />
          <StatCard
            icon={<Lightbulb className="size-5" />}
            label="Intervenções sugeridas"
            value={sugestoesAgrupadas.length}
            color="success"
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <InfoField label="Turma" value={turma.nome} />
          <InfoField label="Curso" value={turma.curso.nome} />
          <InfoField label="Professor" value={turma.professor.nome} />
        </div>
      </SectionCard>

      <SectionCard title="Principais pontos de atenção">
        {atencaoAgrupada.length === 0 ? (
          <Vazio>Nenhum ponto de atenção registrado.</Vazio>
        ) : (
          <ol className="divide-y rounded-lg border">
            {atencaoAgrupada.map((p, i) => (
              <li key={i} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-extrabold text-primary-hover">
                  {i + 1}
                </span>
                <span className="flex-1 text-[15px]">{p.texto}</span>
                <span className="shrink-0 text-sm whitespace-nowrap text-muted-foreground">
                  {p.n} {p.n === 1 ? "registro" : "registros"}
                </span>
              </li>
            ))}
          </ol>
        )}
      </SectionCard>

      <SectionCard title="Pontos positivos observados">
        {pontosPositivos.length === 0 ? (
          <Vazio>Nenhum ponto positivo registrado.</Vazio>
        ) : (
          <ul className="space-y-1.5 rounded-lg border px-4 py-3 text-[15px]">
            {pontosPositivos.map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        <h2 className="mt-7 text-xl font-extrabold tracking-tight sm:text-2xl">
          Intervenções sugeridas
        </h2>
        <TitleAccent className="mb-5" />
        {sugestoesAgrupadas.length === 0 ? (
          <Vazio>Nenhuma intervenção sugerida.</Vazio>
        ) : (
          <ol className="space-y-1.5 rounded-lg border px-4 py-3 text-[15px]">
            {sugestoesAgrupadas.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-5 shrink-0 text-right tabular-nums">{i + 1}.</span>
                <span className="flex-1">{s.texto}</span>
                {s.n > 1 && (
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {s.n} registros
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}
      </SectionCard>

      <ResumoIA turmaId={turma.id} conteudo={conteudo} salvo={resumoSalvo} />

      <SectionCard title="Registros enviados">
        {enviados.length === 0 ? (
          <Vazio>Esta turma ainda não tem registros enviados.</Vazio>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-surface-strong text-left text-title">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Data</th>
                  <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">
                    Aula / Tema
                  </th>
                  <th className="px-4 py-2.5 font-semibold">Enviado em</th>
                  <th className="w-px px-4 py-2.5 font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {enviados.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 tabular-nums">{formatarData(r.data)}</td>
                    <td className="hidden px-4 py-3 sm:table-cell">{r.tema || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground tabular-nums">
                      {r.enviadoEm ? formatarDataHora(r.enviadoEm) : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/coordenacao/turmas/${turma.id}/registros/${r.id}`}
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

      <SectionCard
        title="Gestão da turma"
        description="Somente a Coordenação: trocar o professor responsável, finalizar ou reabrir e excluir a turma."
      >
        <RealocarProfessor
          turmaId={turma.id}
          atualId={turma.professorId}
          opcoes={responsaveis.map((r) => ({
            id: r.id,
            nome: r.nome,
            coordenacao: r.role === "COORDENACAO",
          }))}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Registros, rascunhos e histórico vão junto. O novo professor passa a ver e editar a turma.
        </p>

        <div className="mt-5 border-t pt-5">
          <EditarDadosTurma
            turmaId={turma.id}
            inicial={{
              curso: turma.curso.nome,
              turma: turma.nome,
              periodo: turma.periodo ?? "",
              cargaHoraria: turma.cargaHoraria != null ? String(turma.cargaHoraria) : "",
            }}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-3 border-t pt-5">
          {finalizadaEm ? (
            <BotaoConfirmar
              acao={reabrirTurma.bind(null, turma.id)}
              rotulo="Reabrir turma"
              aviso="A turma volta para as turmas em andamento e o professor pode registrar aulas de novo."
              sucesso="Turma reaberta."
              tipo="restaurar"
              icone={<RotateCcw />}
            />
          ) : (
            <BotaoConfirmar
              acao={finalizarTurma.bind(null, turma.id)}
              rotulo="Finalizar turma"
              aviso="A turma sai das turmas em andamento e fica só para consulta (sem novos registros)."
              sucesso="Turma finalizada."
              tipo="restaurar"
              icone={<CircleCheck />}
            />
          )}
          <BotaoConfirmar
          acao={arquivarTurma.bind(null, turma.id)}
          rotulo="Excluir turma"
          aviso={`A turma "${turma.nome}" vai sair de todas as telas, inclusive das do professor, junto com todos os registros dela (enviados e rascunhos). Nada é apagado do banco.`}
          sucesso="Turma excluída. Ela pode ser restaurada em Excluídos."
          redirecionarPara="/coordenacao/acompanhamento"
        />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Excluir: a turma fica guardada em Excluídos e pode ser restaurada.
        </p>
      </SectionCard>

      <PageNote>
        A Coordenação acompanha os registros enviados pelo professor e identifica
        padrões de evolução e pontos de atenção da turma.
      </PageNote>
    </main>
  );
}


function Vazio({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
