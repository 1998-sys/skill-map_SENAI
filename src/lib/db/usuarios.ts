import type { User } from "@supabase/supabase-js";
import type { Role } from "@/lib/types";
import { db, exigir } from "./cliente";

// Usuários do SkillMap = logins do Supabase Auth + perfil (nome e papel) da
// tabela `profiles`. Só usado no servidor, pelas telas/ações da Coordenação.

export type SituacaoUsuario = "ATIVO" | "TROCAR_SENHA" | "DESATIVADO";

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  role: Role;
  situacao: SituacaoUsuario;
  ultimoAcesso: Date | null;
};

// "Desativado" = login bloqueado (ban) no Supabase Auth.
export function estaDesativado(u: Pick<User, "banned_until">): boolean {
  return Boolean(u.banned_until) && new Date(u.banned_until as string) > new Date();
}

// Todos os logins (a API devolve em páginas).
export async function listarLogins(): Promise<User[]> {
  const porPagina = 200;
  const todos: User[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await db().auth.admin.listUsers({ page, perPage: porPagina });
    if (error) throw new Error(`Auth: ${error.message}`);
    todos.push(...data.users);
    if (data.users.length < porPagina) return todos;
  }
}

export async function listarUsuarios(): Promise<Usuario[]> {
  const [logins, perfis] = await Promise.all([
    listarLogins(),
    db().from("profiles").select("id, nome, email, role"),
  ]);
  const porId = new Map(
    exigir<{ id: string; nome: string; email: string; role: Role }[]>(perfis).map(
      (p) => [p.id, p],
    ),
  );

  return logins
    .map((u): Usuario => {
      const p = porId.get(u.id);
      return {
        id: u.id,
        nome: p?.nome ?? u.email ?? "—",
        email: u.email ?? p?.email ?? "",
        role: p?.role ?? "PROFESSOR",
        situacao: estaDesativado(u)
          ? "DESATIVADO"
          : u.app_metadata?.trocar_senha
            ? "TROCAR_SENHA"
            : "ATIVO",
        ultimoAcesso: u.last_sign_in_at ? new Date(u.last_sign_in_at) : null,
      };
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
