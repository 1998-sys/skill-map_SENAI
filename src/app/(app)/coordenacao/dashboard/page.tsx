import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  Clock,
  FolderOpen,
  Send,
  Users,
} from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { obterDashboardCoordenacao } from "@/lib/dashboard";
import { formatarData } from "@/lib/datas";
import { buttonVariants } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { PageNote } from "@/components/ui/info-field";

const DIAS_ALERTA = 14; // dias corridos sem registro → alerta (onda 2 usa dias letivos)

export default async function DashboardCoordenacaoPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "COORDENACAO") redirect("/dashboard");

  const { consolidado, turmas, registrosPorSemana } =
    await obterDashboardCoordenacao();

  const maxSemana = Math.max(1, ...registrosPorSemana.map((s) => s.total));

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      <SectionCard
        title="Dashboard de acompanhamento"
        description="Visão de todas as turmas — se o SkillMap está sendo alimentado e em que etapa está cada registro. Sem ranking de professores."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Users className="size-5" />}
            label="Turmas"
            value={consolidado.totalTurmas}
          />
          <StatCard
            icon={<AlertTriangle className="size-5" />}
            label="Turmas sem registro"
            value={consolidado.turmasSemRegistro}
            color={consolidado.turmasSemRegistro > 0 ? "warning" : "success"}
          />
          <StatCard
            icon={<Send className="size-5" />}
            label="Registros recebidos"
            value={consolidado.totalEnviados}
            color="success"
          />
          <StatCard
            icon={<Clock className="size-5" />}
            label="Tempo médio até o envio"
            value={
              consolidado.tempoMedioEnvioDias != null
                ? `${consolidado.tempoMedioEnvioDias} d`
                : "—"
            }
            color="neutral"
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Registros por semana"
        description="Total de registros diários feitos nas últimas 8 semanas (todas as turmas)."
      >
        <div className="flex items-end gap-2 sm:gap-3" style={{ height: 160 }}>
          {registrosPorSemana.map((s) => {
            const altura = Math.round((s.total / maxSemana) * 120);
            return (
              <div
                key={s.inicio.getTime()}
                className="flex flex-1 flex-col items-center justify-end gap-1.5"
              >
                <span className="text-xs font-semibold tabular-nums text-title">
                  {s.total}
                </span>
                <div
                  className="w-full max-w-10 rounded-t bg-primary"
                  style={{ height: Math.max(3, altura) }}
                  aria-hidden="true"
                />
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {s.rotulo}
                </span>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="Turmas"
        description="Funil da análise e atividade recente por turma."
      >
        {turmas.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhuma turma cadastrada ainda.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-surface-strong text-left text-title">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Turma</th>
                  <th className="hidden px-4 py-2.5 font-semibold md:table-cell">
                    Professor
                  </th>
                  <th className="px-4 py-2.5 text-center font-semibold">
                    Registros
                  </th>
                  <th className="hidden px-4 py-2.5 font-semibold lg:table-cell">
                    Funil (sem · IA · validada · enviada)
                  </th>
                  <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">
                    Atividade
                  </th>
                  <th className="w-px px-4 py-2.5 font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {turmas.map((t) => {
                  const parada =
                    t.diasDesdeUltimoRegistro == null ||
                    t.diasDesdeUltimoRegistro > DIAS_ALERTA;
                  return (
                    <tr key={t.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{t.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.cursoNome}
                        </p>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        {t.professorNome}
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums">
                        {t.totalRegistros}
                      </td>
                      <td className="hidden px-4 py-3 lg:table-cell">
                        <Funil funil={t.funil} />
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        {t.ultimoRegistro == null ? (
                          <span className="text-xs font-medium text-warning">
                            Sem registros
                          </span>
                        ) : (
                          <span
                            className={`text-xs font-medium ${parada ? "text-warning" : "text-muted-foreground"}`}
                          >
                            {parada ? "Parada há " : "Último: "}
                            {t.diasDesdeUltimoRegistro === 0
                              ? "hoje"
                              : `${t.diasDesdeUltimoRegistro} d`}
                            {!parada && ` (${formatarData(t.ultimoRegistro)})`}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {t.enviados > 0 ? (
                          <Link
                            href={`/coordenacao/turmas/${t.id}`}
                            className={buttonVariants({
                              variant: "outline-primary",
                              size: "sm",
                            })}
                          >
                            <FolderOpen /> Abrir
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Sem envios
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <PageNote>
        Indicadores de acompanhamento, calculados sobre os registros existentes. A
        cobertura do calendário (aulas previstas, taxa de preenchimento, dias letivos
        sem registro) chega quando a turma tiver datas e carga cadastradas.
      </PageNote>
    </main>
  );
}

function Funil({
  funil,
}: {
  funil: { sem: number; gerada: number; validada: number; enviada: number };
}) {
  const itens = [
    { n: funil.sem, cor: "bg-muted-foreground", titulo: "Sem análise" },
    { n: funil.gerada, cor: "bg-warning", titulo: "Gerada pela IA" },
    { n: funil.validada, cor: "bg-success", titulo: "Validada" },
    { n: funil.enviada, cor: "bg-primary", titulo: "Enviada" },
  ];
  return (
    <div className="flex items-center gap-3 text-xs tabular-nums">
      {itens.map((i) => (
        <span key={i.titulo} className="flex items-center gap-1.5" title={i.titulo}>
          <span className={`inline-block size-2.5 rounded-sm ${i.cor}`} aria-hidden="true" />
          {i.n}
        </span>
      ))}
    </div>
  );
}
