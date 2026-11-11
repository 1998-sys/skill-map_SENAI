import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  Archive,
  CalendarCheck,
  CalendarX,
  Clock,
  ClipboardList,
  FileText,
  ListX,
  PauseCircle,
  Send,
  UserCog,
  Users,
} from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { DIAS_PARADA, obterPainelCoordenacao, type TurmaAlerta } from "@/lib/dashboard";
import { formatarData, formatarDataHora, formatarDiaDoInstante } from "@/lib/datas";
import { buttonVariants } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { PageNote } from "@/components/ui/info-field";

// Dashboard da Coordenação — tela única (antes: "Painel" + "Dashboard").
// Indicadores, o que precisa de ação, últimos envios, pontos de atenção que se
// repetem, atividade por semana e um resumo de acessos/excluídos.
// A lista de turmas com o resumo de cada uma fica em "Acompanhamento".
// Somente leitura e sem ranking de professores.

export default async function DashboardCoordenacaoPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "COORDENACAO") redirect("/dashboard");

  const painel = await obterPainelCoordenacao();
  const { consolidado, registrosPorSemana, alertas, ultimosEnvios, pontosFrequentes } = painel;
  const maxSemana = Math.max(1, ...registrosPorSemana.map((s) => s.total));
  const ultimoEnvio = ultimosEnvios[0]?.enviadoEm ?? null;
  const totalAlertas =
    alertas.aulasSemRegistro.length +
    alertas.paradas.length +
    alertas.semCalendario.length +
    alertas.semCapacidades.length;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-6">
      {/* 1. Indicadores */}
      <SectionCard
        title="Dashboard"
        description="Indicadores de todas as turmas: se o SkillMap está sendo alimentado, o que já chegou à Coordenação e o que precisa de atenção. Sem ranking de professores."
        action={
          <Link href="/coordenacao/acompanhamento" className={buttonVariants({ variant: "outline-primary", size: "sm" })}>
            <ClipboardList /> Acompanhamento por turma
          </Link>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard icon={<Users className="size-5" />} label="Turmas" value={consolidado.totalTurmas} />
          <StatCard
            icon={<Send className="size-5" />}
            label="Registros recebidos"
            value={consolidado.totalEnviados}
            color="success"
          />
          <StatCard
            icon={<CalendarCheck className="size-5" />}
            label="Cobertura do calendário"
            value={consolidado.coberturaGeral != null ? `${consolidado.coberturaGeral}%` : "—"}
            color={
              consolidado.coberturaGeral == null
                ? "neutral"
                : consolidado.aulasSemRegistro > 0
                  ? "warning"
                  : "success"
            }
          />
          <StatCard
            icon={<Clock className="size-5" />}
            label="Tempo médio até o envio"
            value={
              consolidado.tempoMedioEnvioDias != null ? `${consolidado.tempoMedioEnvioDias} d` : "—"
            }
            color="neutral"
          />
          <StatCard
            icon={<FileText className="size-5" />}
            label="Último envio"
            value={ultimoEnvio ? formatarDiaDoInstante(ultimoEnvio) : "—"}
            color="neutral"
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {consolidado.turmasComCalendario === 0
            ? "Nenhuma turma tem calendário ainda. O professor monta o calendário na tela da turma."
            : `Cobertura = aulas que já aconteceram com registro, ${
                consolidado.turmasComCalendario === 1
                  ? "na única turma com calendário"
                  : `nas ${consolidado.turmasComCalendario} turmas com calendário`
              }.`}
        </p>
      </SectionCard>

      {/* 2. O que precisa de ação */}
      <SectionCard
        title="Precisa de atenção"
        description={
          totalAlertas === 0
            ? undefined
            : "Turmas que pedem alguma ação. Clique para abrir o acompanhamento da turma."
        }
      >
        {totalAlertas === 0 ? (
          <p className="rounded-lg bg-success-soft px-4 py-3 text-sm font-medium text-success">
            Nenhum alerta: todas as turmas estão com calendário, capacidades e registros em dia.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            <GrupoAlerta
              icone={<ListX className="size-4" />}
              titulo="Aulas sem registro"
              itens={alertas.aulasSemRegistro}
              tom="warning"
            />
            <GrupoAlerta
              icone={<PauseCircle className="size-4" />}
              titulo={`Paradas há mais de ${DIAS_PARADA} dias`}
              itens={alertas.paradas}
              tom="warning"
            />
            <GrupoAlerta
              icone={<AlertTriangle className="size-4" />}
              titulo="Sem capacidades cadastradas"
              itens={alertas.semCapacidades}
              tom="warning"
            />
            <GrupoAlerta
              icone={<CalendarX className="size-4" />}
              titulo="Sem calendário"
              itens={alertas.semCalendario}
              tom="neutral"
            />
          </div>
        )}
      </SectionCard>

      {/* 3. Últimos envios + pontos de atenção */}
      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Últimos registros recebidos">
          {ultimosEnvios.length === 0 ? (
            <Vazio>Ainda não há registros enviados à Coordenação.</Vazio>
          ) : (
            <ul className="divide-y rounded-lg border">
              {ultimosEnvios.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/coordenacao/turmas/${r.turmaId}/registros/${r.id}`}
                    className="flex items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium">
                        {r.turmaNome}{" "}
                        <span className="font-normal text-muted-foreground">
                          · aula de {formatarData(r.data)}
                        </span>
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {r.professorNome}
                        {r.tema && ` · ${r.tema}`}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                      {r.enviadoEm ? formatarDataHora(r.enviadoEm) : "—"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Pontos de atenção mais frequentes"
          description="Nas análises validadas dos registros enviados, de todas as turmas."
        >
          {pontosFrequentes.length === 0 ? (
            <Vazio>Nenhum ponto de atenção registrado ainda.</Vazio>
          ) : (
            <ol className="divide-y rounded-lg border">
              {pontosFrequentes.map((p, i) => (
                <li key={i} className="flex items-start gap-3 px-4 py-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-extrabold text-primary-hover">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm">{p.texto}</span>
                  <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">
                    {p.n} {p.n === 1 ? "registro" : "registros"}
                    {p.turmas > 1 && ` · ${p.turmas} turmas`}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </SectionCard>
      </div>

      {/* 4. Registros por semana */}
      <SectionCard
        title="Registros por semana"
        description="Total de registros diários feitos nas últimas 8 semanas (todas as turmas)."
      >
        <div className="flex items-end gap-2 sm:gap-3" style={{ height: 160 }}>
          {registrosPorSemana.map((s) => {
            const altura = Math.round((s.total / maxSemana) * 120);
            return (
              <div key={s.inicio.getTime()} className="flex flex-1 flex-col items-center justify-end gap-1.5">
                <span className="text-xs font-semibold tabular-nums text-title">{s.total}</span>
                <div
                  className="w-full max-w-10 rounded-t bg-primary"
                  style={{ height: Math.max(3, altura) }}
                  aria-hidden="true"
                />
                <span className="text-[11px] tabular-nums text-muted-foreground">{s.rotulo}</span>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* 5. Acessos e excluídos */}
      <div className="grid gap-5 md:grid-cols-2">
        <SectionCard
          title="Acessos"
          action={
            <Link href="/coordenacao/usuarios" className={buttonVariants({ variant: "outline-primary", size: "sm" })}>
              <UserCog /> Usuários
            </Link>
          }
        >
          <div className="grid grid-cols-3 gap-3 text-center">
            <Numero valor={painel.acessos.ativos} rotulo="professores ativos" />
            <Numero
              valor={painel.acessos.trocarSenha}
              rotulo="aguardando troca de senha"
              destaque={painel.acessos.trocarSenha > 0}
            />
            <Numero valor={painel.acessos.desativados} rotulo="desativados" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {painel.acessos.coordenacao}{" "}
            {painel.acessos.coordenacao === 1 ? "acesso ativo de Coordenação" : "acessos ativos de Coordenação"}.
          </p>
        </SectionCard>

        <SectionCard
          title="Excluídos"
          action={
            <Link href="/coordenacao/excluidos" className={buttonVariants({ variant: "outline-primary", size: "sm" })}>
              <Archive /> Ver excluídos
            </Link>
          }
        >
          <div className="grid grid-cols-2 gap-3 text-center">
            <Numero valor={painel.excluidos.turmas} rotulo="turmas excluídas" />
            <Numero valor={painel.excluidos.registros} rotulo="registros excluídos" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Excluídos ficam guardados e podem ser restaurados.
          </p>
        </SectionCard>
      </div>

      <PageNote>
        Indicadores de acompanhamento, sem ranking de professores. Só registros enviados
        contam como recebidos; a cobertura compara as aulas do calendário que já aconteceram
        com os registros feitos.
      </PageNote>
    </main>
  );
}

function GrupoAlerta({
  icone,
  titulo,
  itens,
  tom,
}: {
  icone: React.ReactNode;
  titulo: string;
  itens: TurmaAlerta[];
  tom: "warning" | "neutral";
}) {
  if (itens.length === 0) return null;
  const cor = tom === "warning" ? "border-warning/30 bg-warning-soft" : "border-border bg-muted";
  const texto = tom === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className={`rounded-lg border p-3 ${cor}`}>
      <p className={`mb-2 flex items-center gap-2 text-sm font-semibold ${texto}`}>
        {icone} {titulo} ({itens.length})
      </p>
      <ul className="space-y-1">
        {itens.slice(0, 5).map((t) => (
          <li key={t.id}>
            <Link
              href={`/coordenacao/turmas/${t.id}`}
              className="flex justify-between gap-3 rounded px-2 py-1 text-sm hover:bg-card"
            >
              <span className="truncate font-medium">{t.nome}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{t.detalhe}</span>
            </Link>
          </li>
        ))}
        {itens.length > 5 && (
          <li className="px-2 text-xs text-muted-foreground">+{itens.length - 5} turmas</li>
        )}
      </ul>
    </div>
  );
}

function Numero({ valor, rotulo, destaque }: { valor: number; rotulo: string; destaque?: boolean }) {
  return (
    <div className="rounded-lg bg-muted px-2 py-3">
      <p className={`text-2xl font-extrabold tabular-nums ${destaque ? "text-warning" : "text-title"}`}>
        {valor}
      </p>
      <p className="text-xs text-muted-foreground">{rotulo}</p>
    </div>
  );
}

function Vazio({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

