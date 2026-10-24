import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { Filtros } from "./filtros";

function formatarData(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(d);
}

function formatarDataHora(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

function trecho(texto: string, max = 160) {
  const t = texto.trim().replace(/\s+/g, " ");
  return t.length > max ? `${t.slice(0, max).trimEnd()}…` : t;
}

export default async function HistoricoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { id } = await params;
  const { status: statusParam, q: qParam } = await searchParams;

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const turma = await prisma.turma.findUnique({
    where: { id },
    select: { id: true, nome: true, professorId: true, curso: { select: { nome: true } } },
  });

  if (!turma || turma.professorId !== profile.id) notFound();

  const status =
    statusParam === "RASCUNHO" || statusParam === "ENVIADO"
      ? statusParam
      : undefined;
  const q = (qParam ?? "").trim();

  const registros = await prisma.registro.findMany({
    where: { turmaId: turma.id, ...(status ? { status } : {}) },
    orderBy: { data: "desc" },
    include: {
      analises: {
        orderBy: { versao: "desc" },
        take: 1,
        include: {
          capacidadesIdentificadas: {
            include: { capacidade: { select: { id: true, texto: true } } },
          },
        },
      },
    },
  });

  // Monta a visão de cada registro (capacidades + síntese vêm da última análise).
  const itens = registros.map((r) => {
    const ultima = r.analises[0];
    const capacidades =
      ultima?.capacidadesIdentificadas.map((ac) => ac.capacidade.texto) ?? [];
    const sintese =
      ultima?.pontosAtencao[0] ??
      ultima?.pontosPositivos[0] ??
      trecho(r.textoTrabalhado);

    // Campo de busca: cobre tema, relato, capacidades e síntese/análise.
    const haystack = [
      r.tema ?? "",
      r.textoTrabalhado,
      r.textoDesempenho,
      r.textoObservacoes ?? "",
      ...capacidades,
      ...(ultima?.pontosPositivos ?? []),
      ...(ultima?.pontosAtencao ?? []),
      ...(ultima?.sugestoes ?? []),
      ultima?.observacoesAdicionais ?? "",
    ]
      .join("\n")
      .toLowerCase();

    return { r, capacidades, sintese, haystack };
  });

  const filtrados = q
    ? itens.filter((it) => it.haystack.includes(q.toLowerCase()))
    : itens;

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <div className="mb-6">
        <Link
          href={`/turmas/${turma.id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← {turma.nome}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Histórico da turma</h1>
        <p className="text-sm text-muted-foreground">
          {turma.curso.nome} — memória pedagógica em ordem cronológica
        </p>
      </div>

      <Filtros status={status ?? ""} q={q} />

      <p className="mt-4 text-xs text-muted-foreground">
        {filtrados.length}{" "}
        {filtrados.length === 1 ? "registro" : "registros"}
        {(q || status) && " (filtrado)"}
      </p>

      {filtrados.length === 0 ? (
        <p className="mt-4 rounded-xl border bg-card p-5 text-sm text-muted-foreground">
          {registros.length === 0
            ? "Nenhum registro ainda. Registre a próxima aula para começar a memória pedagógica da turma."
            : "Nenhum registro corresponde aos filtros aplicados."}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {filtrados.map(({ r, capacidades, sintese }) => {
            const isRascunho = r.status === "RASCUNHO";
            return (
              <li key={r.id}>
                <Link
                  href={`/turmas/${turma.id}/registros/${r.id}`}
                  className="block rounded-xl border bg-card p-4 transition hover:bg-accent"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{formatarData(r.data)}</p>
                      {r.tema && (
                        <p className="text-xs text-muted-foreground">{r.tema}</p>
                      )}
                    </div>
                    <span
                      className={
                        isRascunho
                          ? "shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                          : "shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs text-emerald-700"
                      }
                    >
                      {isRascunho ? "Rascunho" : "Enviado"}
                    </span>
                  </div>

                  {!isRascunho && r.enviadoEm && (
                    <p className="mt-1 text-xs text-emerald-700">
                      Enviado em {formatarDataHora(r.enviadoEm)}
                    </p>
                  )}

                  {capacidades.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {capacidades.map((texto, i) => (
                        <span
                          key={i}
                          className="rounded-full border bg-background px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          {texto}
                        </span>
                      ))}
                    </div>
                  )}

                  {sintese && (
                    <p className="mt-3 text-sm text-muted-foreground">{sintese}</p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
