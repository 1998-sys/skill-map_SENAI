import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { formatarDataHora } from "@/lib/datas";
import { SectionCard } from "@/components/ui/section-card";
import {
  testarViaPrisma,
  testarViaSupabase,
  turmasViaSupabase,
  type ResultadoTeste,
} from "@/lib/teste-conexao";

// Página de diagnóstico: compara a conexão com o banco via supabase-js (HTTPS)
// e via Prisma (Postgres). Fica FORA de (app)/ de propósito: o layout de lá
// busca o perfil pelo Prisma e quebraria numa rede que bloqueia o Postgres.

export const dynamic = "force-dynamic";
export const metadata = { title: "Teste de conexão · SkillMap" };

export default async function TesteConexaoPage() {
  // O login usa o Supabase Auth (HTTPS), então funciona mesmo sem o Prisma.
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Os dois testes rodam ao mesmo tempo.
  const [supabase, prisma, turmas] = await Promise.all([
    testarViaSupabase(),
    testarViaPrisma(),
    turmasViaSupabase(),
  ]);

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-title">
          Teste de conexão com o banco
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Logado como {user.email} · testado em {formatarDataHora(new Date())} ·{" "}
          <Link href="/teste-conexao" className="font-semibold text-primary underline">
            testar de novo
          </Link>
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <CartaoResultado
          resultado={supabase}
          descricao="Data API do Supabase pela porta 443. É o mesmo caminho do login."
        />
        <CartaoResultado
          resultado={prisma}
          descricao="Conexão Postgres pelo pooler. É o que o resto do sistema usa hoje."
        />
      </div>

      <SectionCard
        title="Exemplo de consulta com relacionamento"
        description='supabase-js: from("turmas").select("nome, curso:cursos(nome), professor:profiles(nome)")'
      >
        {turmas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma turma retornada (tabela vazia ou bloqueada pelas regras de acesso).
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4 font-semibold">Turma</th>
                  <th className="py-2 pr-4 font-semibold">Curso</th>
                  <th className="py-2 font-semibold">Professor</th>
                </tr>
              </thead>
              <tbody>
                {turmas.map((t, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-2 pr-4 font-medium">{t.nome}</td>
                    <td className="py-2 pr-4">{t.curso ?? "—"}</td>
                    <td className="py-2">{t.professor ?? "—"}</td>
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

function CartaoResultado({
  resultado,
  descricao,
}: {
  resultado: ResultadoTeste;
  descricao: string;
}) {
  return (
    <SectionCard title={resultado.via} description={descricao}>
      <p
        className={`mb-4 rounded-md px-3 py-2 text-sm font-semibold ${
          resultado.ok ? "bg-success-soft text-success" : "bg-brand-soft text-destructive"
        }`}
      >
        {resultado.ok ? "✅ Conectou" : "❌ Falhou"} em {(resultado.ms / 1000).toFixed(1)}s
        {resultado.erro && (
          <span className="mt-1 block font-normal">{resultado.erro}</span>
        )}
      </p>
      <table className="w-full text-left text-sm">
        <thead className="text-muted-foreground">
          <tr>
            <th className="py-1.5 pr-4 font-semibold">Tabela</th>
            <th className="py-1.5 text-right font-semibold">Linhas</th>
          </tr>
        </thead>
        <tbody>
          {resultado.tabelas.map((t) => (
            <tr key={t.tabela} className="border-t">
              <td className="py-1.5 pr-4 font-mono text-xs">{t.tabela}</td>
              <td className="py-1.5 text-right" title={t.erro}>
                {t.ok ? t.linhas : <span className="text-destructive">erro</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </SectionCard>
  );
}
