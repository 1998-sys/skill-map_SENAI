import Link from "next/link";
import { redirect } from "next/navigation";
import { CircleCheck, ClipboardList, Search } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { obterDashboardCoordenacao, type TurmaDashboard } from "@/lib/dashboard";
import { normalizarBusca } from "@/lib/catalogo-cursos";
import { formatarDataHora, formatarDiaDoInstante } from "@/lib/datas";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionCard } from "@/components/ui/section-card";
import { PageNote } from "@/components/ui/info-field";

// Acompanhamento (Coordenação): a lista de turmas e, para cada uma, a entrada
// para o resumo da turma (/coordenacao/turmas/[id]) — pontos de atenção,
// positivos, intervenções sugeridas, resumo com IA e registros enviados.
// Fica separado do Dashboard, que mostra só os indicadores gerais.

type Situacao = "andamento" | "finalizadas" | "todas";
const SITUACOES: { valor: Situacao; rotulo: string }[] = [
  { valor: "andamento", rotulo: "Em andamento" },
  { valor: "finalizadas", rotulo: "Finalizadas" },
  { valor: "todas", rotulo: "Todas" },
];

export default async function AcompanhamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; situacao?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "COORDENACAO") redirect("/dashboard");

  const { q: qParam, situacao: situacaoParam } = await searchParams;
  const q = (qParam ?? "").trim();
  const situacao: Situacao =
    situacaoParam === "finalizadas" || situacaoParam === "todas" ? situacaoParam : "andamento";
  const { turmas } = await obterDashboardCoordenacao();

  // Busca sem acento por turma, curso ou professor (todas as palavras).
  const palavras = normalizarBusca(q).split(/\s+/).filter(Boolean);
  const contagem = {
    andamento: turmas.filter((t) => !t.finalizadaEm).length,
    finalizadas: turmas.filter((t) => t.finalizadaEm).length,
    todas: turmas.length,
  };
  const filtradas = turmas
    .filter((t) =>
      situacao === "todas" ? true : situacao === "finalizadas" ? !!t.finalizadaEm : !t.finalizadaEm,
    )
    .filter((t) => {
      if (palavras.length === 0) return true;
      const alvo = normalizarBusca(`${t.nome} ${t.cursoNome} ${t.professorNome}`);
      return palavras.every((p) => alvo.includes(p));
    })
    // Quem recebeu envio mais recente primeiro; sem envio vai para o fim.
    .sort((a, b) => (b.ultimoEnvio?.getTime() ?? 0) - (a.ultimoEnvio?.getTime() ?? 0));

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      <SectionCard
        title="Acompanhamento"
        description="Escolha uma turma para ver o resumo do acompanhamento: pontos de atenção, avanços, intervenções sugeridas, resumo com IA e os registros enviados pelo professor."
      >
        <nav aria-label="Situação das turmas" className="mb-4 flex flex-wrap gap-2">
          {SITUACOES.map((s) => {
            const params = new URLSearchParams();
            if (s.valor !== "andamento") params.set("situacao", s.valor);
            if (q) params.set("q", q);
            const ativo = s.valor === situacao;
            return (
              <Link
                key={s.valor}
                href={`/coordenacao/acompanhamento${params.size ? `?${params}` : ""}`}
                aria-current={ativo ? "page" : undefined}
                className={buttonVariants({
                  variant: ativo ? "default" : "outline-primary",
                  size: "sm",
                })}
              >
                {s.rotulo} ({contagem[s.valor]})
              </Link>
            );
          })}
        </nav>

        <form className="flex flex-col gap-2 sm:flex-row" role="search">
          {situacao !== "andamento" && <input type="hidden" name="situacao" value={situacao} />}
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              name="q"
              defaultValue={q}
              aria-label="Buscar turma"
              placeholder="Buscar por turma, curso ou professor"
              className="h-10 pl-9 text-[15px]"
            />
          </div>
          <button type="submit" className={buttonVariants({ variant: "outline-primary", size: "lg", className: "h-10" })}>
            Buscar
          </button>
          {q && (
            <Link
              href={`/coordenacao/acompanhamento${situacao !== "andamento" ? `?situacao=${situacao}` : ""}`}
              className={buttonVariants({ variant: "ghost", size: "lg", className: "h-10" })}
            >
              Limpar
            </Link>
          )}
        </form>
        <p className="mt-3 text-xs text-muted-foreground">
          {filtradas.length} {filtradas.length === 1 ? "turma" : "turmas"}
          {q && ` ${filtradas.length === 1 ? "encontrada" : "encontradas"} para “${q}”`}
        </p>
      </SectionCard>

      {filtradas.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
          {turmas.length === 0
            ? "Nenhuma turma cadastrada ainda."
            : q
              ? "Nenhuma turma encontrada."
              : situacao === "finalizadas"
                ? "Nenhuma turma finalizada ainda."
                : "Nenhuma turma em andamento."}
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {filtradas.map((t) => (
            <CartaoTurma key={t.id} turma={t} />
          ))}
        </ul>
      )}

      <PageNote>
        O resumo de cada turma usa só os registros enviados pelo professor (validados).
        Rascunhos não aparecem para a Coordenação.
      </PageNote>
    </main>
  );
}

function CartaoTurma({ turma: t }: { turma: TurmaDashboard }) {
  const href = `/coordenacao/turmas/${t.id}`;
  const cob = t.cobertura;
  const pendentes = cob?.semRegistro.length ?? 0;
  return (
    <li className="flex flex-col rounded-xl border bg-card p-4 shadow-sm">
      <Link href={href} className="group">
        <p className="font-semibold text-title group-hover:underline">{t.nome}</p>
        <p className="text-sm text-muted-foreground">{t.cursoNome}</p>
        <p className="text-xs text-muted-foreground">Prof. {t.professorNome}</p>
      </Link>
      {t.finalizadaEm && (
        <p className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">
          <CircleCheck className="size-3.5" /> Finalizada em {formatarDiaDoInstante(t.finalizadaEm)}
        </p>
      )}

      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Dado rotulo="enviados" valor={String(t.enviados)} destaque />
        <Dado
          rotulo="cobertura"
          valor={cob && cob.ocorridas > 0 ? `${cob.percentual}%` : "—"}
        />
        <Dado rotulo="registros" valor={String(t.totalRegistros)} />
      </dl>

      <p className="mt-3 text-xs text-muted-foreground">
        Último envio: {t.ultimoEnvio ? formatarDataHora(t.ultimoEnvio) : "nenhum ainda"}
        {!cob && " · sem calendário"}
        {pendentes > 0 && !t.finalizadaEm && (
          <span className="font-medium text-warning">
            {" "}
            · {pendentes} {pendentes === 1 ? "aula sem registro" : "aulas sem registro"}
          </span>
        )}
      </p>

      <Link
        href={href}
        className={buttonVariants({ variant: "outline-primary", className: "mt-4 w-full sm:w-auto sm:self-end" })}
      >
        <ClipboardList /> Ver acompanhamento
      </Link>
    </li>
  );
}

function Dado({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className="flex flex-col-reverse rounded-lg bg-muted px-2 py-2">
      <dt className="text-[11px] text-muted-foreground">{rotulo}</dt>
      <dd className={`text-xl font-extrabold tabular-nums ${destaque ? "text-success" : "text-title"}`}>
        {valor}
      </dd>
    </div>
  );
}
