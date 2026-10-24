import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateRegistro } from "@/lib/actions/registros";
import { RegistroForm } from "../registro-form";
import { AnalisePanel } from "./analise-panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageNote } from "@/components/ui/info-field";
import { formatarData, formatarDataHora } from "@/lib/datas";

// A análise chama a API da IA, que pode levar alguns segundos.
export const maxDuration = 60;

export default async function RegistroPage({
  params,
}: {
  params: Promise<{ id: string; registroId: string }>;
}) {
  const { id, registroId } = await params;
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
          professor: { select: { nome: true } },
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

  const isRascunho = registro.status === "RASCUNHO";

  const ultima = registro.analises[0];
  const analise = ultima
    ? {
        tipo: ultima.tipo,
        versao: ultima.versao,
        capacidadeIds: ultima.capacidadesIdentificadas.map(
          (x) => x.capacidadeId,
        ),
        pontosPositivos: ultima.pontosPositivos,
        pontosAtencao: ultima.pontosAtencao,
        sugestoes: ultima.sugestoes,
        observacoesAdicionais: ultima.observacoesAdicionais,
      }
    : null;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      <div>
        <Link
          href={`/turmas/${registro.turma.id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← {registro.turma.nome}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            Registro de {formatarData(registro.data)}
          </h1>
          <StatusBadge status={registro.status} />
        </div>
        {!isRascunho && registro.enviadoEm && (
          <p className="mt-1 text-sm text-primary">
            Enviado à Coordenação em {formatarDataHora(registro.enviadoEm)}
          </p>
        )}
      </div>

      <RegistroForm
        action={updateRegistro}
        hidden={{ registroId: registro.id }}
        contexto={{
          curso: registro.turma.curso.nome,
          turma: registro.turma.nome,
          professor: registro.turma.professor.nome,
        }}
        defaults={{
          data: registro.data.toISOString().slice(0, 10),
          tema: registro.tema ?? "",
          textoTrabalhado: registro.textoTrabalhado,
          textoDesempenho: registro.textoDesempenho,
          textoObservacoes: registro.textoObservacoes ?? "",
        }}
        submitLabel="Salvar alterações"
        readOnly={!isRascunho}
      />

      <AnalisePanel
        key={ultima?.id ?? "nova"}
        registroId={registro.id}
        capacidades={registro.turma.capacidades}
        analise={analise}
        status={registro.status}
      />

      <PageNote>
        A IA organiza as observações do professor e sugere ações pedagógicas; a
        decisão final permanece com o docente.
      </PageNote>
    </main>
  );
}
