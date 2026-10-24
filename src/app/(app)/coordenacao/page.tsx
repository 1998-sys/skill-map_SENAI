import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CalendarDays, FileText, FolderOpen, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { PageNote } from "@/components/ui/info-field";
import { formatarDataHora, formatarDiaDoInstante } from "@/lib/datas";

export default async function CoordenacaoPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "COORDENACAO") redirect("/dashboard");

  // Turmas que têm ao menos um registro ENVIADO, com a contagem de enviados e
  // a data do último envio. Rascunhos não entram.
  const turmas = await prisma.turma.findMany({
    where: { registros: { some: { status: "ENVIADO" } } },
    include: {
      curso: { select: { nome: true } },
      professor: { select: { nome: true } },
      registros: {
        where: { status: "ENVIADO" },
        select: { enviadoEm: true },
      },
    },
  });

  const linhas = turmas
    .map((turma) => {
      const enviados = turma.registros;
      const ultimoEnvio = enviados.reduce<Date | null>((max, r) => {
        if (!r.enviadoEm) return max;
        return !max || r.enviadoEm > max ? r.enviadoEm : max;
      }, null);
      return {
        id: turma.id,
        nome: turma.nome,
        curso: turma.curso.nome,
        professor: turma.professor.nome,
        total: enviados.length,
        ultimoEnvio,
      };
    })
    .sort((a, b) => {
      const ta = a.ultimoEnvio?.getTime() ?? 0;
      const tb = b.ultimoEnvio?.getTime() ?? 0;
      return tb - ta;
    });

  const totalRecebidos = linhas.reduce((s, t) => s + t.total, 0);
  const ultimoGeral = linhas[0]?.ultimoEnvio ?? null;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      <SectionCard
        title="Painel de Acompanhamento da Coordenação"
        description="Acompanhamento consolidado das turmas, calculado apenas sobre os registros enviados pelos professores."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            icon={<Users className="size-5" />}
            label="Turmas acompanhadas"
            value={linhas.length}
          />
          <StatCard
            icon={<FileText className="size-5" />}
            label="Registros recebidos"
            value={totalRecebidos}
          />
          <StatCard
            icon={<CalendarDays className="size-5" />}
            label="Último envio"
            value={ultimoGeral ? formatarDiaDoInstante(ultimoGeral) : "—"}
          />
        </div>
      </SectionCard>

      <SectionCard title="Turmas">
        {linhas.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Ainda não há registros enviados à Coordenação.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Turma</th>
                  <th className="hidden px-4 py-2.5 font-semibold md:table-cell">
                    Professor
                  </th>
                  <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">
                    Registros
                  </th>
                  <th className="hidden px-4 py-2.5 font-semibold md:table-cell">
                    Último envio
                  </th>
                  <th className="w-px px-4 py-2.5 font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {linhas.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{t.nome}</p>
                      <p className="text-xs text-muted-foreground">{t.curso}</p>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">{t.professor}</td>
                    <td className="hidden px-4 py-3 tabular-nums sm:table-cell">
                      {t.total}
                    </td>
                    <td className="hidden px-4 py-3 whitespace-nowrap tabular-nums md:table-cell">
                      {t.ultimoEnvio ? formatarDataHora(t.ultimoEnvio) : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/coordenacao/turmas/${t.id}`}
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

      <PageNote>
        A Coordenação acompanha os registros enviados pelo professor e identifica
        padrões de evolução e pontos de atenção da turma.
      </PageNote>
    </main>
  );
}
