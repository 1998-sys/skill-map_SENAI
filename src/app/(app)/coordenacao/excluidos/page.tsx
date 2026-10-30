import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { listarArquivados } from "@/lib/db/consultas";
import { restaurarRegistro, restaurarTurma } from "@/lib/actions/arquivamento";
import { formatarData, formatarDataHora } from "@/lib/datas";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageNote } from "@/components/ui/info-field";
import { BotaoConfirmar } from "@/components/botao-confirmar";

// Turmas e registros excluídos (arquivados) pela Coordenação. Nada foi
// apagado do banco: daqui dá para restaurar.
export default async function ExcluidosPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "COORDENACAO") redirect("/dashboard");

  const { turmas, registros } = await listarArquivados();

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      <SectionCard
        title="Turmas excluídas"
        description="Ao restaurar, a turma volta com os registros que foram excluídos junto com ela."
      >
        {turmas.length === 0 ? (
          <Vazio>Nenhuma turma excluída.</Vazio>
        ) : (
          <ul className="divide-y rounded-lg border">
            {turmas.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium">{t.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.curso.nome} · professor: {t.professor.nome}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Excluída em {formatarDataHora(t.excluidoEm)}
                    {t.excluidoPor && ` por ${t.excluidoPor}`}
                  </p>
                </div>
                <BotaoConfirmar
                  tipo="restaurar"
                  acao={restaurarTurma.bind(null, t.id)}
                  rotulo="Restaurar turma"
                  aviso={`A turma "${t.nome}" volta a aparecer para o professor e para a Coordenação.`}
                  sucesso="Turma restaurada."
                />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        title="Registros excluídos"
        description="Registros excluídos um a um. Os que saíram junto com uma turma voltam quando a turma é restaurada."
      >
        {registros.length === 0 ? (
          <Vazio>Nenhum registro excluído.</Vazio>
        ) : (
          <ul className="divide-y rounded-lg border">
            {registros.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium tabular-nums">{formatarData(r.data)}</p>
                    <StatusBadge status={r.status} short />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {r.turma.nome}
                    {r.tema && ` · ${r.tema}`}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Excluído em {formatarDataHora(r.excluidoEm)}
                    {r.excluidoPor && ` por ${r.excluidoPor}`}
                  </p>
                </div>
                <BotaoConfirmar
                  tipo="restaurar"
                  acao={restaurarRegistro.bind(null, r.id)}
                  rotulo="Restaurar registro"
                  aviso={`O registro de ${formatarData(r.data)} volta para a turma "${r.turma.nome}".`}
                  sucesso="Registro restaurado."
                />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <PageNote>
        Excluir não apaga nada do banco: preserva a rastreabilidade dos registros
        pedagógicos. Somente a Coordenação exclui e restaura.
      </PageNote>
    </main>
  );
}

function Vazio({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
