import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Acesso ao banco pela Data API do Supabase (HTTPS, porta 443).
//
// Substitui o Prisma (que conectava direto no Postgres, portas 5432/6543).
// Usa a chave SECRETA (service role), que ignora o RLS — o mesmo poder que o
// Prisma tinha. Por isso:
//   - só pode ser usado no SERVIDOR (Server Components e Server Actions);
//   - as regras de permissão continuam no código ("o professor é dono?").
// A variável SUPABASE_SERVICE_ROLE_KEY nunca deve ter o prefixo NEXT_PUBLIC_.

let cliente: SupabaseClient | undefined;

export function db(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("db() só pode ser usado no servidor.");
  }
  if (!cliente) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !chave) {
      throw new Error(
        "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.",
      );
    }
    cliente = createClient(url, chave, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cliente;
}

// O supabase-js devolve { data, error } em vez de lançar exceção.
// `exigir` lança o erro (como o Prisma fazia) e devolve só os dados.
export function exigir<T>(resposta: {
  data: unknown;
  error: { message: string } | null;
}): T {
  if (resposta.error) throw new Error(`Banco: ${resposta.error.message}`);
  return resposta.data as T;
}

// ─── Datas ──────────────────────────────────────────────────────────────────
// As colunas de instante são `timestamp` SEM fuso, gravadas em UTC (padrão do
// Prisma). A Data API devolve "2026-10-24T17:25:34.871", sem o "Z" — e o
// JavaScript leria isso no fuso local. Então acrescentamos o "Z".

export function lerInstante(valor: string): Date;
export function lerInstante(valor: string | null): Date | null;
export function lerInstante(valor: string | null): Date | null {
  if (!valor) return null;
  const temFuso = /(Z|[+-]\d\d:?\d\d)$/.test(valor);
  return new Date(temFuso ? valor : `${valor}Z`);
}

// Coluna `date` (só o dia): "2026-10-24" → meia-noite UTC, igual ao Prisma.
export function lerDia(valor: string): Date {
  return new Date(`${valor.slice(0, 10)}T00:00:00Z`);
}

// Para gravar instantes (created_at, updated_at, enviado_em).
export function agora(): string {
  return new Date().toISOString();
}

// O banco não gera o id nem o updated_at: no Prisma, quem fazia isso era o
// próprio Prisma (@default(uuid()) e @updatedAt). Agora fazemos no código.
export function novoId(): string {
  return crypto.randomUUID();
}
