import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import {
  buscarTurma,
  listarRegistrosComUltimaAnalise,
} from "@/lib/db/consultas";
import {
  CalendarDays,
  FileText,
  FolderOpen,
  Lightbulb,
  TriangleAlert,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SectionCard, TitleAccent } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { InfoField, PageNote } from "@/components/ui/info-field";
import { ResumoIA } from "./resumo-ia";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { arquivarTurma } from "@/lib/actions/arquivamento";
import type { ConteudoConsolidado } from "@/lib/ia/resumo";
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

  const dados = await buscarTurma(id);
  if (!dados) notFound();

  // Só registros ENVIADOS, cada um com a última análise VALIDADA.
  const registros = await listarRegistrosComUltimaAnalise(id, {
    status: "ENVIADO",
    tipoAnalise: "VALIDADA",
  });
  const turma = { ...dados, registros };

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
    const a = r.ultimaAnalise;
    if (!a) continue;
    pontosPositivos.push(...a.pontosPositivos);
    pontosAtencao.push(...a.pontosAtencao);
    sugestoes.push(...a.sugestoes);
  }

  // Para o resumo com IA: cada registro enviado (com a última análise validada),
  // em ordem cronológica, para a IA apontar a evolução da turma.
  const conteudo: ConteudoConsolidado = {
    turmaNome: turma.nome,
    cursoNome: turma.curso.nome,
    totalEnviados: enviados.length,
    registros: [...enviados]
      .sort((x, y) => x.data.getTime() - y.data.getTime())
      .flatMap((r) => {
        const a = r.ultimaAnalise;
        if (!a) return [];
        return [
          {
            data: formatarData(r.data),
            tema: r.tema,
            capacidades: a.capacidades.map((c) => c.texto),
            pontosPositivos: a.pontosPositivos,
            pontosAtencao: a.pontosAtencao,
            sugestoes: a.sugestoes,
            observacoes: a.observacoesAdicionais,
          },
        ];
      }),
  };

  // Só para exibição: agrupa itens repetidos (mesmo texto) e conta em quantos
  // registros aparecem, do mais frequente para o menos.
  const atencaoAgrupada = agrupar(pontosAtencao);
  const sugestoesAgrupadas = agrupar(sugestoes);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      <Link
        href="/coordenacao"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Painel da Coordenação
      </Link>

      <SectionCard title="Painel de Acompanhamento da Coordenação">
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

      <ResumoIA conteudo={conteudo} />

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
        title="Excluir turma"
        description="Somente a Coordenação pode excluir. A turma fica guardada em Excluídos e pode ser restaurada."
      >
        <BotaoConfirmar
          acao={arquivarTurma.bind(null, turma.id)}
          rotulo="Excluir turma"
          aviso={`A turma "${turma.nome}" vai sair de todas as telas, inclusive das do professor, junto com todos os registros dela (enviados e rascunhos). Nada é apagado do banco.`}
          sucesso="Turma excluída. Ela pode ser restaurada em Excluídos."
          redirecionarPara="/coordenacao/dashboard"
        />
      </SectionCard>

      <PageNote>
        A Coordenação acompanha os registros enviados pelo professor e identifica
        padrões de evolução e pontos de atenção da turma.
      </PageNote>
    </main>
  );
}

function agrupar(itens: string[]) {
  const mapa = new Map<string, { texto: string; n: number }>();
  for (const item of itens) {
    const chave = item.trim().toLowerCase();
    if (!chave) continue;
    const atual = mapa.get(chave);
    if (atual) atual.n += 1;
    else mapa.set(chave, { texto: item.trim(), n: 1 });
  }
  return [...mapa.values()].sort((a, b) => b.n - a.n);
}

function Vazio({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
