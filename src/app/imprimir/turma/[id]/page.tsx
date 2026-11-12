import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { montarAcompanhamento } from "@/lib/acompanhamento";
import { formatarData, formatarDataHora } from "@/lib/datas";
import { BotaoImprimir } from "./botao-imprimir";

export const metadata = { title: "Relatório consolidado da turma · SkillMap" };

// Versão para impressão do acompanhamento da turma (Coordenação): base
// documental para reuniões pedagógicas. Fica fora do grupo (app) para sair
// sem menu e sem barra. Mostra o último resumo com IA salvo.
export default async function ImprimirTurmaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "COORDENACAO") redirect("/dashboard");

  const dados = await montarAcompanhamento(id);
  if (!dados) notFound();
  const { turma, enviados, ultimoEnvio, pontosPositivos, atencaoAgrupada, sugestoesAgrupadas, resumoSalvo } =
    dados;

  const ordenados = [...enviados].sort((a, b) => a.data.getTime() - b.data.getTime());
  const periodo =
    ordenados.length > 0
      ? `${formatarData(ordenados[0].data)} a ${formatarData(ordenados[ordenados.length - 1].data)}`
      : "—";

  return (
    <div className="min-h-screen bg-card text-foreground print:min-h-0">
      <div className="mx-auto max-w-3xl px-6 py-8 print:max-w-none print:px-0 print:py-0">
        <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
          <p className="text-sm text-muted-foreground">
            Confira e use o botão para imprimir ou salvar em PDF.
          </p>
          <BotaoImprimir />
        </div>

        <header className="border-b-2 border-primary pb-4">
          <p className="text-xs font-bold tracking-wide text-primary uppercase">SENAI SkillMap</p>
          <h1 className="text-2xl font-extrabold">Relatório consolidado da turma</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Emitido em {formatarDataHora(new Date())} por {profile.nome} · baseado só nos registros
            enviados e validados pelo professor.
          </p>
        </header>

        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          <Campo rotulo="Turma" valor={turma.nome} />
          <Campo rotulo="Curso" valor={turma.curso.nome} />
          <Campo rotulo="Professor" valor={turma.professor.nome} />
          <Campo rotulo="Registros enviados" valor={String(enviados.length)} />
          <Campo rotulo="Aulas no período" valor={periodo} />
          <Campo rotulo="Último envio" valor={ultimoEnvio ? formatarDataHora(ultimoEnvio) : "—"} />
        </dl>

        <Secao titulo="Resumo da turma (gerado por IA)">
          {resumoSalvo ? (
            <>
              <p className="mb-2 text-xs text-muted-foreground">
                Gerado em {formatarDataHora(resumoSalvo.criadoEm)}
                {resumoSalvo.autorNome && ` por ${resumoSalvo.autorNome}`}, com{" "}
                {resumoSalvo.totalRegistros}{" "}
                {resumoSalvo.totalRegistros === 1 ? "registro" : "registros"}. Texto de apoio,
                revisado pela Coordenação; não atribui nota.
                {enviados.length > resumoSalvo.totalRegistros &&
                  ` Atenção: há ${enviados.length - resumoSalvo.totalRegistros} registro(s) enviado(s) depois deste resumo.`}
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{resumoSalvo.texto}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum resumo gerado. Gere o resumo na tela de acompanhamento para incluí-lo aqui.
            </p>
          )}
        </Secao>

        <Secao titulo="Principais pontos de atenção">
          <ListaAgrupada itens={atencaoAgrupada} vazio="Nenhum ponto de atenção registrado." />
        </Secao>

        <Secao titulo="Pontos positivos observados">
          {pontosPositivos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum ponto positivo registrado.</p>
          ) : (
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {pontosPositivos.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          )}
        </Secao>

        <Secao titulo="Intervenções sugeridas">
          <ListaAgrupada itens={sugestoesAgrupadas} vazio="Nenhuma intervenção sugerida." />
        </Secao>

        <Secao titulo="Registros enviados">
          {ordenados.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum registro enviado.</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-1.5 pr-3 font-semibold">Aula</th>
                  <th className="py-1.5 pr-3 font-semibold">Tema</th>
                  <th className="py-1.5 font-semibold">Enviado em</th>
                </tr>
              </thead>
              <tbody>
                {ordenados.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 break-inside-avoid">
                    <td className="py-1.5 pr-3 whitespace-nowrap tabular-nums">{formatarData(r.data)}</td>
                    <td className="py-1.5 pr-3">{r.tema || "—"}</td>
                    <td className="py-1.5 whitespace-nowrap tabular-nums">
                      {r.enviadoEm ? formatarDataHora(r.enviadoEm) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Secao>

        <footer className="mt-8 border-t pt-3 text-[11px] text-muted-foreground">
          O SkillMap é apoio ao acompanhamento pedagógico: não substitui Plano de Ensino,
          avaliação, diário, nota ou frequência, e não faz ranking de professores ou turmas.
        </footer>
      </div>
    </div>
  );
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{rotulo}</dt>
      <dd className="font-semibold">{valor}</dd>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 break-inside-avoid-page">
      <h2 className="mb-2 border-l-4 border-primary pl-2 text-base font-extrabold">{titulo}</h2>
      {children}
    </section>
  );
}

function ListaAgrupada({ itens, vazio }: { itens: { texto: string; n: number }[]; vazio: string }) {
  if (itens.length === 0) return <p className="text-sm text-muted-foreground">{vazio}</p>;
  return (
    <ol className="list-decimal space-y-1 pl-5 text-sm">
      {itens.map((i, k) => (
        <li key={k}>
          {i.texto}
          {i.n > 1 && <span className="text-muted-foreground"> ({i.n} registros)</span>}
        </li>
      ))}
    </ol>
  );
}
