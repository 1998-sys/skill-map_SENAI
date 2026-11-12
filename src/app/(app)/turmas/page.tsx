import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import {
  listarTurmasDoProfessor,
} from "@/lib/db/consultas";
import { CircleCheck, FolderOpen, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { formatarDiaDoInstante } from "@/lib/datas";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import { arquivarTurma } from "@/lib/actions/arquivamento";

// Filtro da lista: por padrão só as turmas em andamento; as finalizadas
// (cursos encerrados, só consulta) ficam numa aba própria.
type Situacao = "andamento" | "finalizadas" | "todas";
const SITUACOES: { valor: Situacao; rotulo: string }[] = [
  { valor: "andamento", rotulo: "Em andamento" },
  { valor: "finalizadas", rotulo: "Finalizadas" },
  { valor: "todas", rotulo: "Todas" },
];

export default async function TurmasPage({
  searchParams,
}: {
  searchParams: Promise<{ situacao?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { situacao: situacaoParam } = await searchParams;
  const situacao: Situacao =
    situacaoParam === "finalizadas" || situacaoParam === "todas" ? situacaoParam : "andamento";

  const todas = await listarTurmasDoProfessor(profile.id);
  const contagem = {
    andamento: todas.filter((t) => !t.finalizadaEm).length,
    finalizadas: todas.filter((t) => t.finalizadaEm).length,
    todas: todas.length,
  };
  const turmas = todas.filter((t) =>
    situacao === "todas" ? true : situacao === "finalizadas" ? !!t.finalizadaEm : !t.finalizadaEm,
  );

  // Só a Coordenação exclui (arquiva) turmas; a ação confere de novo no servidor.
  const podeExcluir = profile.role === "COORDENACAO";
  const excluir = (t: { id: string; nome: string }) => (
    <BotaoConfirmar
      acao={arquivarTurma.bind(null, t.id)}
      rotulo="Excluir"
      aviso={`A turma "${t.nome}" vai sair de todas as telas, junto com os registros dela. Nada é apagado do banco: dá para restaurar em Excluídos.`}
      sucesso="Turma excluída. Ela pode ser restaurada em Excluídos."
    />
  );

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      <SectionCard
        title="Minhas turmas"
        description="Escolha uma turma para ver as capacidades, registrar aulas e consultar o histórico."
        action={
          <Link href="/turmas/nova" className={buttonVariants({ size: "lg" })}>
            <Plus /> Nova turma
          </Link>
        }
      >
        <nav aria-label="Situação das turmas" className="mb-4 flex flex-wrap gap-2">
          {SITUACOES.map((s) => {
            const ativo = s.valor === situacao;
            return (
              <Link
                key={s.valor}
                href={s.valor === "andamento" ? "/turmas" : `/turmas?situacao=${s.valor}`}
                aria-current={ativo ? "page" : undefined}
                className={buttonVariants({ variant: ativo ? "default" : "outline-primary", size: "sm" })}
              >
                {s.rotulo} ({contagem[s.valor]})
              </Link>
            );
          })}
        </nav>

        {turmas.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center">
            <p className="text-sm text-muted-foreground">
              {todas.length === 0
                ? "Você ainda não cadastrou nenhuma turma."
                : situacao === "finalizadas"
                  ? "Nenhuma turma finalizada ainda. Ao terminar um curso, finalize a turma na tela dela."
                  : "Nenhuma turma em andamento."}
            </p>
            {situacao !== "finalizadas" && (
              <Link
                href="/turmas/nova"
                className={buttonVariants({ size: "lg", className: "mt-4" })}
              >
                <Plus /> {todas.length > 0 ? "Nova turma" : "Cadastrar primeira turma"}
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-surface-strong text-left text-title">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Turma / Curso</th>
                  <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">
                    Capacidades
                  </th>
                  <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">
                    Registros
                  </th>
                  <th className="w-px px-4 py-2.5 font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {turmas.map((turma) => (
                  <tr key={turma.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{turma.nome}</p>
                      <p className="text-xs text-muted-foreground">{turma.curso.nome}</p>
                      {turma.finalizadaEm && (
                        <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">
                          <CircleCheck className="size-3.5" /> Finalizada em{" "}
                          {formatarDiaDoInstante(turma.finalizadaEm)}
                        </p>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 tabular-nums sm:table-cell">
                      {turma.totalCapacidades}
                    </td>
                    <td className="hidden px-4 py-3 tabular-nums sm:table-cell">
                      {turma.totalRegistros}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link
                          href={`/turmas/${turma.id}`}
                          className={buttonVariants({ variant: "outline-primary" })}
                        >
                          <FolderOpen /> {turma.finalizadaEm ? "Consultar" : "Abrir"}
                        </Link>
                        {podeExcluir && excluir(turma)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </main>
  );
}
