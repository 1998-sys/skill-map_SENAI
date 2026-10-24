import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { ResumoIA } from "./resumo-ia";
import type { ConteudoConsolidado } from "@/lib/actions/coordenacao";

export const maxDuration = 60;

const fmtData = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });
const fmtDataHora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
  dateStyle: "short",
  timeStyle: "short",
});

export default async function CoordenacaoTurmaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "COORDENACAO") redirect("/dashboard");

  const turma = await prisma.turma.findUnique({
    where: { id },
    include: {
      curso: { select: { nome: true } },
      registros: {
        where: { status: "ENVIADO" },
        orderBy: { data: "desc" },
        include: {
          analises: {
            where: { tipo: "VALIDADA" },
            orderBy: { versao: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!turma) notFound();

  const enviados = turma.registros;

  // Último envio (max enviadoEm).
  const ultimoEnvio = enviados.reduce<Date | null>((max, r) => {
    if (!r.enviadoEm) return max;
    return !max || r.enviadoEm > max ? r.enviadoEm : max;
  }, null);

  // Consolidação: agrega os campos da última Analise VALIDADA de cada enviado.
  const pontosPositivos: string[] = [];
  const pontosAtencao: string[] = [];
  const sugestoes: string[] = [];
  for (const r of enviados) {
    const a = r.analises[0];
    if (!a) continue;
    pontosPositivos.push(...a.pontosPositivos);
    pontosAtencao.push(...a.pontosAtencao);
    sugestoes.push(...a.sugestoes);
  }

  const conteudo: ConteudoConsolidado = {
    turmaNome: turma.nome,
    cursoNome: turma.curso.nome,
    totalEnviados: enviados.length,
    pontosPositivos,
    pontosAtencao,
    sugestoes,
  };

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <header className="mb-6">
        <Link
          href="/coordenacao"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Painel da Coordenação
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{turma.nome}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{turma.curso.nome}</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Registros recebidos</p>
          <p className="mt-1 text-2xl font-semibold">{enviados.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Último envio</p>
          <p className="mt-1 text-lg font-medium">
            {ultimoEnvio ? fmtDataHora.format(ultimoEnvio) : "—"}
          </p>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <ConsolidadoCard
          titulo="Pontos positivos"
          itens={pontosPositivos}
          vazio="Nenhum ponto positivo registrado."
        />
        <ConsolidadoCard
          titulo="Pontos de atenção"
          itens={pontosAtencao}
          vazio="Nenhum ponto de atenção registrado."
        />
      </div>

      <div className="mt-4">
        <ConsolidadoCard
          titulo="Intervenções sugeridas"
          itens={sugestoes}
          vazio="Nenhuma intervenção sugerida."
        />
      </div>

      <ResumoIA conteudo={conteudo} />

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-medium">Registros enviados</h2>
        {enviados.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Esta turma ainda não tem registros enviados.
          </p>
        ) : (
          <ul className="space-y-2">
            {enviados.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/turmas/${turma.id}/registros/${r.id}`}
                  className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4 transition hover:bg-accent"
                >
                  <div>
                    <p className="font-medium">
                      {fmtData.format(r.data)}
                      {r.tema ? ` · ${r.tema}` : ""}
                    </p>
                    {r.enviadoEm && (
                      <p className="text-xs text-muted-foreground">
                        Enviado em {fmtDataHora.format(r.enviadoEm)}
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">Abrir →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function ConsolidadoCard({
  titulo,
  itens,
  vazio,
}: {
  titulo: string;
  itens: string[];
  vazio: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-sm font-medium">{titulo}</h3>
      {itens.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{vazio}</p>
      ) : (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {itens.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
