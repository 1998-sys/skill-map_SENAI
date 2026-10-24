import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const fmtDataHora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
  dateStyle: "short",
  timeStyle: "short",
});

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
        total: enviados.length,
        ultimoEnvio,
      };
    })
    .sort((a, b) => {
      const ta = a.ultimoEnvio?.getTime() ?? 0;
      const tb = b.ultimoEnvio?.getTime() ?? 0;
      return tb - ta;
    });

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <header className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Painel da Coordenação</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhamento consolidado das turmas, calculado apenas sobre os
          registros enviados pelos professores.
        </p>
      </header>

      {linhas.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Ainda não há registros enviados à Coordenação.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {linhas.map((t) => (
            <li key={t.id}>
              <Link
                href={`/coordenacao/turmas/${t.id}`}
                className="block rounded-xl border bg-card p-4 transition hover:bg-accent"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{t.nome}</p>
                    <p className="text-sm text-muted-foreground">{t.curso}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>
                      {t.total}{" "}
                      {t.total === 1 ? "registro recebido" : "registros recebidos"}
                    </p>
                    {t.ultimoEnvio && (
                      <p>Último envio: {fmtDataHora.format(t.ultimoEnvio)}</p>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
