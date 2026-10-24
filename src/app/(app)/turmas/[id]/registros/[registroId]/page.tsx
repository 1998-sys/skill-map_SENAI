import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateRegistro } from "@/lib/actions/registros";
import { RegistroForm } from "../registro-form";
import { AnalisePanel } from "./analise-panel";

// A análise chama a API da IA, que pode levar alguns segundos.
export const maxDuration = 60;

function formatarData(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(d);
}

function formatarDataHora(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

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
    <main className="mx-auto w-full max-w-2xl p-6">
      <div className="mb-6">
        <Link
          href={`/turmas/${registro.turma.id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← {registro.turma.nome}
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold">
            Registro de {formatarData(registro.data)}
          </h1>
          <span
            className={
              isRascunho
                ? "rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                : "rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700"
            }
          >
            {isRascunho ? "Rascunho" : "Enviado à Coordenação"}
          </span>
        </div>
        {registro.tema && (
          <p className="text-sm text-muted-foreground">Tema: {registro.tema}</p>
        )}
        {!isRascunho && registro.enviadoEm && (
          <p className="mt-1 text-xs text-emerald-700">
            Enviado à Coordenação em {formatarDataHora(registro.enviadoEm)}
          </p>
        )}
      </div>

      <RegistroForm
        action={updateRegistro}
        hidden={{ registroId: registro.id }}
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
    </main>
  );
}
