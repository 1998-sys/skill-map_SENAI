import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatarData, formatarDataHora } from "@/lib/datas";
import { buttonVariants } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { InfoField, PageNote } from "@/components/ui/info-field";
import { AnalisePanel } from "../analise-panel";

// A análise chama a API da IA, que pode levar alguns segundos.
export const maxDuration = 60;

// Tela "Análise Pedagógica com IA" (spec, tela 5) de um registro diário.
export default async function AnalisePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; registroId: string }>;
  searchParams: Promise<{ gerar?: string }>;
}) {
  const { id, registroId } = await params;
  const { gerar } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const registro = await prisma.registro.findUnique({
    where: { id: registroId },
    include: {
      turma: {
        select: {
          id: true,
          nome: true,
          professorId: true,
          curso: { select: { nome: true } },
          capacidades: {
            orderBy: { ordem: "asc" },
            select: { id: true, texto: true },
          },
        },
      },
      analises: {
        orderBy: { versao: "desc" },
        take: 1,
        include: {
          capacidadesIdentificadas: { select: { capacidadeId: true } },
        },
      },
    },
  });

  if (
    !registro ||
    registro.turma.id !== id ||
    registro.turma.professorId !== profile.id
  ) {
    notFound();
  }

  const ultima = registro.analises[0];
  const analise = ultima
    ? {
        tipo: ultima.tipo,
        versao: ultima.versao,
        capacidadeIds: ultima.capacidadesIdentificadas.map((x) => x.capacidadeId),
        pontosPositivos: ultima.pontosPositivos,
        pontosAtencao: ultima.pontosAtencao,
        sugestoes: ultima.sugestoes,
        observacoesAdicionais: ultima.observacoesAdicionais,
      }
    : null;

  const urlRegistro = `/turmas/${registro.turma.id}/registros/${registro.id}`;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      <div>
        <Link href={urlRegistro} className="text-sm text-muted-foreground hover:underline">
          ← Registro Diário de {formatarData(registro.data)}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight">Análise da IA</h1>
          <StatusBadge status={registro.status} />
        </div>
        {registro.status === "ENVIADO" && registro.enviadoEm && (
          <p className="mt-1 text-sm font-medium text-primary-active">
            Enviado à Coordenação em {formatarDataHora(registro.enviadoEm)}
          </p>
        )}
      </div>

      <SectionCard
        title="Registro analisado"
        action={
          <Link
            href={urlRegistro}
            className={buttonVariants({ variant: "outline-primary", size: "lg" })}
          >
            <FileText /> Ver relato
          </Link>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_2fr_1fr_2fr]">
          <InfoField label="Turma" value={registro.turma.nome} />
          <InfoField label="Curso" value={registro.turma.curso.nome} />
          <InfoField label="Data" value={formatarData(registro.data)} />
          <InfoField label="Aula / Tema" value={registro.tema} />
        </div>
      </SectionCard>

      <AnalisePanel
        key={ultima?.id ?? "nova"}
        registroId={registro.id}
        capacidades={registro.turma.capacidades}
        analise={analise}
        status={registro.status}
        gerarAoAbrir={gerar === "1"}
      />

      <PageNote>
        A IA organiza as observações do professor e sugere ações pedagógicas; a
        decisão final permanece com o docente.
      </PageNote>
    </main>
  );
}
