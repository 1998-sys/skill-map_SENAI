import { db } from "@/lib/db/cliente";
import { prisma } from "@/lib/prisma";

// Teste de conexão com o banco por dois caminhos, lado a lado:
//
// 1. supabase-js → Data API do Supabase por HTTPS (porta 443).
//    Passa em redes que bloqueiam o protocolo do Postgres.
// 2. Prisma → conexão Postgres direta pelo pooler (porta 6543).
//    É o que o resto do sistema usa hoje.
//
// Só leitura: conta as linhas de cada tabela e busca algumas turmas.

export type ResultadoTabela = {
  tabela: string;
  ok: boolean;
  linhas: number | null;
  erro?: string;
};

export type ResultadoTeste = {
  via: string;
  ok: boolean;
  ms: number;
  tabelas: ResultadoTabela[];
  erro?: string;
};

export type TurmaExemplo = {
  nome: string;
  curso: string | null;
  professor: string | null;
};

// Nomes reais das tabelas no Postgres (o schema.prisma usa @@map).
const TABELAS = [
  "profiles",
  "cursos",
  "turmas",
  "capacidades",
  "registros",
  "analises",
  "analise_capacidades",
] as const;

const LIMITE_PRISMA_MS = 8000;

// ─── Caminho 1: supabase-js (HTTPS) ─────────────────────────────────────────
// Usa o mesmo cliente do resto do sistema: chave secreta, só no servidor.
// (Com o RLS ligado e sem policies, a chave pública não lê nenhuma tabela.)
export async function testarViaSupabase(): Promise<ResultadoTeste> {
  const supabase = db();
  const inicio = Date.now();

  const tabelas = await Promise.all(
    TABELAS.map(async (tabela): Promise<ResultadoTabela> => {
      // head: true → não traz as linhas, só a contagem.
      const { count, error } = await supabase
        .from(tabela)
        .select("*", { count: "exact", head: true });
      if (error) return { tabela, ok: false, linhas: null, erro: error.message };
      return { tabela, ok: true, linhas: count ?? 0 };
    }),
  );

  const ok = tabelas.every((t) => t.ok);
  return { via: "supabase-js (HTTPS)", ok, ms: Date.now() - inicio, tabelas };
}

// Exemplo de consulta com relacionamento via supabase-js: cada turma com o
// nome do curso e do professor. As chaves estrangeiras (curso_id,
// professor_id) permitem "embutir" as tabelas relacionadas no select.
export async function turmasViaSupabase(): Promise<TurmaExemplo[]> {
  const supabase = db();
  const { data, error } = await supabase
    .from("turmas")
    .select("nome, curso:cursos(nome), professor:profiles(nome)")
    .order("nome")
    .limit(5);
  if (error || !data) return [];

  return data.map((t) => {
    // O supabase-js sem tipos gerados não sabe se a relação é 1 ou N.
    const curso = t.curso as unknown as { nome: string } | null;
    const professor = t.professor as unknown as { nome: string } | null;
    return { nome: t.nome, curso: curso?.nome ?? null, professor: professor?.nome ?? null };
  });
}

// ─── Caminho 2: Prisma (Postgres na porta 6543) ─────────────────────────────
// Com um limite de tempo: numa rede que bloqueia o Postgres, o Prisma
// demoraria muito para desistir sozinho.
export async function testarViaPrisma(): Promise<ResultadoTeste> {
  const inicio = Date.now();
  const via = "Prisma (Postgres 6543)";

  const contagens = Promise.all([
    prisma.profile.count(),
    prisma.curso.count(),
    prisma.turma.count(),
    prisma.capacidade.count(),
    prisma.registro.count(),
    prisma.analise.count(),
    prisma.analiseCapacidade.count(),
  ]);
  const limite = new Promise<never>((_, rejeitar) =>
    setTimeout(
      () => rejeitar(new Error(`Sem resposta em ${LIMITE_PRISMA_MS / 1000}s`)),
      LIMITE_PRISMA_MS,
    ),
  );

  try {
    const linhas = await Promise.race([contagens, limite]);
    const tabelas = TABELAS.map((tabela, i) => ({ tabela, ok: true, linhas: linhas[i] }));
    return { via, ok: true, ms: Date.now() - inicio, tabelas };
  } catch (e) {
    // Evita "unhandled rejection" se as contagens falharem depois do limite.
    contagens.catch(() => {});
    const mensagem = e instanceof Error ? e.message : String(e);
    // A mensagem do Prisma é longa; a última linha útil basta.
    const erro =
      mensagem.split("\n").map((l) => l.trim()).filter(Boolean).find((l) =>
        /Can't reach|Timed out|Sem resposta|authentication|Tenant/i.test(l),
      ) ?? mensagem.slice(0, 200);
    return {
      via,
      ok: false,
      ms: Date.now() - inicio,
      erro,
      tabelas: TABELAS.map((tabela) => ({ tabela, ok: false, linhas: null })),
    };
  }
}
