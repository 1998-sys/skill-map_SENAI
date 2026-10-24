import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { InfoField, PageNote } from "@/components/ui/info-field";
import { Bullets, Secao } from "@/components/analise-secoes";

// Visão somente leitura de um registro ENVIADO, para a Coordenação.
// Rascunhos nunca aparecem aqui (mesma regra do painel).

const fmtData = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });
const fmtDataHora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
  dateStyle: "short",
  timeStyle: "short",
});

export default async function CoordenacaoRegistroPage({
  params,
}: {
  params: Promise<{ id: string; registroId: string }>;
}) {
  const { id, registroId } = await params;

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "COORDENACAO") redirect("/dashboard");

  const registro = await prisma.registro.findUnique({
    where: { id: registroId },
    include: {
      turma: {
        select: {
          id: true,
          nome: true,
          curso: { select: { nome: true } },
          professor: { select: { nome: true } },
        },
      },
      analises: {
        where: { tipo: "VALIDADA" },
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

  if (!registro || registro.turma.id !== id || registro.status !== "ENVIADO") {
    notFound();
  }

  const analise = registro.analises[0];
  const capacidades =
    analise?.capacidadesIdentificadas
      .map((ac) => ac.capacidade)
      .sort((a, b) => a.ordem - b.ordem)
      .map((c) => c.texto) ?? [];

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      <div>
        <Link
          href={`/coordenacao/turmas/${registro.turma.id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← {registro.turma.nome}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            Registro de {fmtData.format(registro.data)}
          </h1>
          <StatusBadge status={registro.status} />
        </div>
        {registro.enviadoEm && (
          <p className="mt-1 text-sm text-primary">
            Enviado à Coordenação em {fmtDataHora.format(registro.enviadoEm)}
          </p>
        )}
      </div>

      <SectionCard title="Acompanhamento da Turma">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1.3fr_2fr_1.4fr]">
          <InfoField label="Curso" value={registro.turma.curso.nome} />
          <InfoField label="Turma" value={registro.turma.nome} />
          <InfoField label="Professor" value={registro.turma.professor.nome} />
          <InfoField label="Data" value={fmtData.format(registro.data)} />
        </div>
        {registro.tema && (
          <InfoField className="mt-4" label="Aula / Tema" value={registro.tema} />
        )}
      </SectionCard>

      <SectionCard title="Relato do professor">
        <div className="space-y-5">
          <Relato titulo="O que foi trabalhado" texto={registro.textoTrabalhado} />
          <Relato titulo="Desempenho da turma" texto={registro.textoDesempenho} />
          {registro.textoObservacoes && (
            <Relato titulo="Outras observações" texto={registro.textoObservacoes} />
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Análise Pedagógica da Turma"
        description={
          analise
            ? `Versão validada pelo professor · v${analise.versao}`
            : undefined
        }
      >
        {!analise ? (
          <p className="text-sm text-muted-foreground">
            Este registro não tem análise validada.
          </p>
        ) : (
          <div className="divide-y">
            <Secao n={1} titulo="Capacidades identificadas">
              <Bullets itens={capacidades} vazio="Nenhuma capacidade identificada." />
            </Secao>
            <Secao n={2} titulo="Pontos positivos">
              <Bullets itens={analise.pontosPositivos} />
            </Secao>
            <Secao n={3} titulo="Pontos que merecem atenção">
              <Bullets itens={analise.pontosAtencao} />
            </Secao>
            <Secao n={4} titulo="Sugestões para a próxima aula">
              <Bullets itens={analise.sugestoes} numerada />
            </Secao>
            {analise.observacoesAdicionais && (
              <Secao n={5} titulo="Observações adicionais">
                <p className="text-[15px] whitespace-pre-line">
                  {analise.observacoesAdicionais}
                </p>
              </Secao>
            )}
          </div>
        )}
      </SectionCard>

      <PageNote>
        Visão somente leitura. Correções são feitas pelo professor, que reabre o
        registro — o histórico é preservado.
      </PageNote>
    </main>
  );
}

function Relato({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-semibold text-muted-foreground">{titulo}</h3>
      <p className="rounded-lg bg-muted px-4 py-3 text-[15px] leading-relaxed whitespace-pre-line">
        {texto || "—"}
      </p>
    </div>
  );
}
