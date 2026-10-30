import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import {
  buscarTurma,
  listarRegistrosComUltimaAnalise,
} from "@/lib/db/consultas";
import { FolderOpen, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { SectionCard } from "@/components/ui/section-card";
import { PageNote } from "@/components/ui/info-field";
import { formatarData, formatarDataHora } from "@/lib/datas";
import { Filtros } from "./filtros";

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

  const turma = await buscarTurma(id);

  if (!turma || turma.professorId !== profile.id) notFound();

  const status =
    statusParam === "RASCUNHO" || statusParam === "ENVIADO"
      ? statusParam
      : undefined;
  const q = (qParam ?? "").trim();

  const registros = await listarRegistrosComUltimaAnalise(turma.id, { status });

  // Monta a visão de cada registro (capacidades + síntese vêm da última análise).
  const itens = registros.map((r) => {
    const ultima = r.ultimaAnalise;
    const capacidades = ultima?.capacidades.map((c) => c.texto) ?? [];
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

    return { r, capacidades, sintese, haystack, temAnalise: Boolean(ultima) };
  });

  const filtrados = q
    ? itens.filter((it) => it.haystack.includes(q.toLowerCase()))
    : itens;

  // Abre a Análise quando já existe; senão, o Registro Diário (para analisar).
  const abrir = (registroId: string, temAnalise: boolean) =>
    `/turmas/${turma.id}/registros/${registroId}${temAnalise ? "/analise" : ""}`;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-6">
      <Link
        href={`/turmas/${turma.id}`}
        className="text-sm text-muted-foreground hover:underline"
      >
        ← {turma.nome}
      </Link>

      <SectionCard
        title="Histórico de Registros"
        description={`${turma.nome} · ${turma.curso.nome} — memória pedagógica em ordem cronológica`}
        action={
          <Link
            href={`/turmas/${turma.id}/registros/novo`}
            className={buttonVariants({ size: "lg" })}
          >
            <Plus /> Novo registro
          </Link>
        }
      >
        <Filtros status={status ?? ""} q={q} />

        <p className="mt-4 text-xs text-muted-foreground">
          {filtrados.length}{" "}
          {filtrados.length === 1 ? "registro" : "registros"}
          {(q || status) && " (filtrado)"}
        </p>

        {filtrados.length === 0 ? (
          <p className="mt-3 rounded-lg border bg-muted/50 p-5 text-sm text-muted-foreground">
            {registros.length === 0
              ? "Nenhum registro ainda. Registre a próxima aula para começar a memória pedagógica da turma."
              : "Nenhum registro corresponde aos filtros aplicados."}
          </p>
        ) : (
          <>
            {/* Desktop: tabela */}
            <div className="mt-3 hidden overflow-hidden rounded-lg border lg:block">
              <table className="w-full text-sm">
                <thead className="bg-surface-strong text-left text-title">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Data</th>
                    <th className="w-[16%] px-4 py-3 font-semibold">Aula / Tema</th>
                    <th className="w-[28%] px-4 py-3 font-semibold">Capacidades identificadas</th>
                    <th className="w-[28%] px-4 py-3 font-semibold">Síntese</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="w-px px-4 py-3 font-semibold">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtrados.map(({ r, capacidades, sintese, temAnalise }) => (
                    <tr key={r.id} className="align-top">
                      <td className="px-4 py-3.5 tabular-nums whitespace-nowrap">
                        {formatarData(r.data)}
                      </td>
                      <td className="px-4 py-3.5">{r.tema || "—"}</td>
                      <td className="px-4 py-3.5">
                        {capacidades.length > 0 ? (
                          <span className="line-clamp-3" title={capacidades.join(", ")}>
                            {capacidades.join(", ")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        <span className="line-clamp-3" title={sintese}>
                          {sintese}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={r.status} short />
                        {r.status === "ENVIADO" && r.enviadoEm && (
                          <p className="mt-1 text-xs whitespace-nowrap text-muted-foreground">
                            {formatarDataHora(r.enviadoEm)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={abrir(r.id, temAnalise)}
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

            {/* Mobile: cartões */}
            <ul className="mt-3 space-y-3 lg:hidden">
              {filtrados.map(({ r, capacidades, sintese, temAnalise }) => (
                <li key={r.id}>
                  <Link
                    href={abrir(r.id, temAnalise)}
                    className="block rounded-lg border p-4 transition hover:bg-accent"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold tabular-nums">
                          {formatarData(r.data)}
                        </p>
                        {r.tema && <p className="text-sm">{r.tema}</p>}
                      </div>
                      <StatusBadge status={r.status} short />
                    </div>
                    {capacidades.length > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Capacidades: </span>
                        {capacidades.join(", ")}
                      </p>
                    )}
                    {sintese && (
                      <p className="mt-2 text-sm text-muted-foreground">{sintese}</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </SectionCard>

      <PageNote>
        O histórico consolida os registros pedagógicos realizados pelo professor e
        enviados à Coordenação.
      </PageNote>
    </main>
  );
}
