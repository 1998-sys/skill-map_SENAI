import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FolderOpen, Plus } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatarData } from "@/lib/datas";
import { buttonVariants } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { PageNote } from "@/components/ui/info-field";
import {
  SITUACAO_LABEL,
  SituacaoBadge,
  type SituacaoAnalise,
} from "@/components/ui/status-badge";

const FILTROS: { valor: SituacaoAnalise | ""; label: string }[] = [
  { valor: "", label: "Todas" },
  { valor: "gerada", label: SITUACAO_LABEL.gerada },
  { valor: "validada", label: SITUACAO_LABEL.validada },
  { valor: "enviada", label: SITUACAO_LABEL.enviada },
];

const MAX_CAPS = 4;
const MAX_ATENCAO = 2;

// Lista "Análises da Turma": todas as análises (última versão de cada registro),
// com filtro por situação. Abrir leva à tela de Análise do registro.
export default async function AnalisesDaTurmaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ situacao?: string }>;
}) {
  const { id } = await params;
  const { situacao: situacaoParam } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const turma = await prisma.turma.findUnique({
    where: { id },
    select: { id: true, nome: true, professorId: true, curso: { select: { nome: true } } },
  });
  if (!turma || turma.professorId !== profile.id) notFound();

  const registros = await prisma.registro.findMany({
    where: { turmaId: turma.id },
    orderBy: { data: "desc" },
    include: {
      analises: {
        orderBy: { versao: "desc" },
        take: 1,
        include: {
          capacidadesIdentificadas: {
            include: { capacidade: { select: { texto: true, ordem: true } } },
          },
        },
      },
    },
  });

  // Situação = status do registro + tipo da última versão da análise.
  const itens = registros.flatMap((r) => {
    const a = r.analises[0];
    if (!a) return [];
    const situacao: SituacaoAnalise =
      r.status === "ENVIADO" ? "enviada" : a.tipo === "VALIDADA" ? "validada" : "gerada";
    const capacidades = a.capacidadesIdentificadas
      .map((ac) => ac.capacidade)
      .sort((x, y) => x.ordem - y.ordem)
      .map((c) => c.texto);
    return [{ r, a, situacao, capacidades }];
  });
  const semAnalise = registros.length - itens.length;

  const filtro = FILTROS.some((f) => f.valor === situacaoParam && f.valor)
    ? (situacaoParam as SituacaoAnalise)
    : "";
  const contagem = (s: SituacaoAnalise | "") =>
    s ? itens.filter((i) => i.situacao === s).length : itens.length;
  const visiveis = filtro ? itens.filter((i) => i.situacao === filtro) : itens;

  const base = `/turmas/${turma.id}`;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      <Link href={base} className="text-sm text-muted-foreground hover:underline">
        ← {turma.nome}
      </Link>

      <SectionCard
        title="Análises da Turma"
        description={`${turma.nome} · ${turma.curso.nome} — todas as análises pedagógicas, da mais recente para a mais antiga`}
        action={
          <Link href={`${base}/registros/novo`} className={buttonVariants({ size: "lg" })}>
            <Plus /> Novo registro de aula
          </Link>
        }
      >
        <nav aria-label="Filtrar por situação" className="flex flex-wrap gap-2">
          {FILTROS.map((f) => {
            const ativo = f.valor === filtro;
            return (
              <Link
                key={f.label}
                href={f.valor ? `?situacao=${f.valor}` : "?"}
                aria-current={ativo ? "page" : undefined}
                scroll={false}
                className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-colors ${
                  ativo
                    ? "border-primary bg-brand-soft text-primary-active"
                    : "border-border bg-card text-foreground hover:bg-muted"
                }`}
              >
                {f.label}
                <span
                  className={`rounded-full px-1.5 text-xs tabular-nums ${
                    ativo ? "bg-card text-primary-active" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {contagem(f.valor)}
                </span>
              </Link>
            );
          })}
        </nav>

        {visiveis.length === 0 ? (
          <p className="mt-5 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            {itens.length === 0
              ? "Nenhuma análise ainda. Registre uma aula e clique em “Analisar com IA”."
              : "Nenhuma análise nesta situação."}
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {visiveis.map(({ r, a, situacao, capacidades }) => (
              <li
                key={r.id}
                className="rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-extrabold tabular-nums">
                        {formatarData(r.data)}
                      </h3>
                      <SituacaoBadge situacao={situacao} />
                      <span className="text-xs text-muted-foreground">v{a.versao}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{r.tema || "Sem tema"}</p>
                  </div>
                  <Link
                    href={`${base}/registros/${r.id}/analise`}
                    className={buttonVariants({ variant: "outline-primary" })}
                    aria-label={`Abrir análise de ${formatarData(r.data)}`}
                  >
                    <FolderOpen /> Abrir
                  </Link>
                </div>

                <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                  <div className="min-w-0">
                    <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
                      Capacidades identificadas
                    </p>
                    {capacidades.length === 0 ? (
                      <p className="text-muted-foreground">Nenhuma.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {capacidades.slice(0, MAX_CAPS).map((c, i) => (
                          <span
                            key={i}
                            className="max-w-full truncate rounded-full bg-muted px-2.5 py-0.5 text-xs text-foreground"
                            title={c}
                          >
                            {c}
                          </span>
                        ))}
                        {capacidades.length > MAX_CAPS && (
                          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                            +{capacidades.length - MAX_CAPS}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
                      Pontos que merecem atenção
                    </p>
                    {a.pontosAtencao.length === 0 ? (
                      <p className="text-muted-foreground">Nenhum.</p>
                    ) : (
                      <ul className="space-y-1">
                        {a.pontosAtencao.slice(0, MAX_ATENCAO).map((p, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-primary" />
                            <span className="line-clamp-2 min-w-0 break-words">{p}</span>
                          </li>
                        ))}
                        {a.pontosAtencao.length > MAX_ATENCAO && (
                          <li className="pl-3.5 text-xs text-muted-foreground">
                            +{a.pontosAtencao.length - MAX_ATENCAO} na análise completa
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {semAnalise > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            {semAnalise} {semAnalise === 1 ? "registro ainda não tem" : "registros ainda não têm"}{" "}
            análise —{" "}
            <Link href={`${base}/historico`} className="font-semibold text-primary-active hover:underline">
              ver no Histórico
            </Link>
            .
          </p>
        )}
      </SectionCard>

      <PageNote>
        Só a versão validada pelo professor pode ser enviada à Coordenação; a IA
        não substitui a avaliação do docente.
      </PageNote>
    </main>
  );
}
