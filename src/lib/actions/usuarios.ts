"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth";
import { agora, db, exigir } from "@/lib/db/cliente";
import { estaDesativado, listarLogins } from "@/lib/db/usuarios";
import type { Role } from "@/lib/types";

// Gestão de acessos — SOMENTE a Coordenação.
// Versão sem e-mail: a Coordenação cria o usuário com uma senha temporária e
// repassa ao professor; no primeiro acesso ele cria a própria senha
// (marca app_metadata.trocar_senha, que só o servidor altera).

export type UsuarioState = {
  error?: string;
  ok?: boolean;
  // Preenchidos quando uma senha temporária é gerada (mostrada uma única vez).
  senha?: string;
  email?: string;
  nome?: string;
  // Em caso de erro, devolve o que foi digitado para o formulário não apagar.
  valores?: { nome: string; email: string; role: Role };
};

const SEM_PERMISSAO: UsuarioState = {
  error: "Somente a Coordenação pode gerenciar os acessos.",
};

// Desativado = login bloqueado no Supabase Auth por ~100 anos.
const BLOQUEIO = "876000h";

async function exigirCoordenacao() {
  const profile = await getCurrentProfile();
  return profile?.role === "COORDENACAO" ? profile : null;
}

// Senha temporária legível, sem caracteres ambíguos (0/O, 1/l/I).
// Ex.: "Kx7m-Pq4r-T9wz" — tem maiúscula, minúscula e número.
function gerarSenha(): string {
  const maiusculas = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const minusculas = "abcdefghijkmnpqrstuvwxyz";
  const numeros = "23456789";
  const todos = maiusculas + minusculas + numeros;
  const r = crypto.getRandomValues(new Uint32Array(12));
  const c = Array.from(r, (n) => todos[n % todos.length]);
  c[0] = maiusculas[r[0] % maiusculas.length];
  c[1] = minusculas[r[1] % minusculas.length];
  c[2] = numeros[r[2] % numeros.length];
  return `${c.slice(0, 4).join("")}-${c.slice(4, 8).join("")}-${c.slice(8).join("")}`;
}

function revalidar() {
  revalidatePath("/coordenacao/usuarios");
}

// ─── Criar ──────────────────────────────────────────────────────────────────

export async function criarUsuario(
  _prev: UsuarioState,
  formData: FormData,
): Promise<UsuarioState> {
  if (!(await exigirCoordenacao())) return SEM_PERMISSAO;

  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const papel = String(formData.get("role") ?? "PROFESSOR");
  const role: Role = papel === "COORDENACAO" ? "COORDENACAO" : "PROFESSOR";

  const valores = { nome, email, role };
  if (!nome) return { error: "Informe o nome.", valores };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "E-mail inválido.", valores };

  const senha = gerarSenha();
  const { data, error } = await db().auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true, // sem e-mail de confirmação (versão sem e-mail)
    user_metadata: { nome, role }, // o gatilho handle_new_user cria o perfil com isso
    app_metadata: { trocar_senha: true },
  });
  if (error) {
    if (error.code === "email_exists" || /already been registered/i.test(error.message)) {
      return { error: "Já existe um usuário com este e-mail.", valores };
    }
    return { error: `Não foi possível criar o usuário: ${error.message}`, valores };
  }

  // Garante o perfil mesmo se o gatilho não estiver aplicado no banco.
  exigir(
    await db()
      .from("profiles")
      .upsert({ id: data.user.id, email, nome, role, updated_at: agora() }),
  );

  revalidar();
  return { ok: true, senha, email, nome };
}

// ─── Senha temporária ───────────────────────────────────────────────────────

export async function gerarSenhaTemporaria(userId: string): Promise<UsuarioState> {
  const eu = await exigirCoordenacao();
  if (!eu) return SEM_PERMISSAO;
  if (userId === eu.id) {
    return { error: "Para a sua própria senha, use \"Trocar minha senha\"." };
  }

  const { data, error } = await db().auth.admin.getUserById(userId);
  if (error || !data.user) return { error: "Usuário não encontrado." };
  if (estaDesativado(data.user)) {
    return { error: "Este acesso está desativado. Reative antes de gerar uma senha." };
  }

  const senha = gerarSenha();
  const r = await db().auth.admin.updateUserById(userId, {
    password: senha,
    app_metadata: { ...data.user.app_metadata, trocar_senha: true },
  });
  if (r.error) return { error: `Não foi possível gerar a senha: ${r.error.message}` };

  revalidar();
  return { ok: true, senha, email: data.user.email ?? "" };
}

// ─── Desativar / reativar ───────────────────────────────────────────────────

export async function desativarUsuario(userId: string): Promise<UsuarioState> {
  const eu = await exigirCoordenacao();
  if (!eu) return SEM_PERMISSAO;
  if (userId === eu.id) return { error: "Você não pode desativar o seu próprio acesso." };

  // Não deixar o sistema sem nenhuma Coordenação ativa.
  const alvo = exigir<{ role: Role } | null>(
    await db().from("profiles").select("role").eq("id", userId).maybeSingle(),
  );
  if (alvo?.role === "COORDENACAO") {
    const coordenadores = exigir<{ id: string }[]>(
      await db().from("profiles").select("id").eq("role", "COORDENACAO"),
    ).map((p) => p.id);
    const ativos = (await listarLogins()).filter(
      (u) => coordenadores.includes(u.id) && u.id !== userId && !estaDesativado(u),
    );
    if (ativos.length === 0) {
      return { error: "Não é possível desativar o último acesso de Coordenação." };
    }
  }

  const { error } = await db().auth.admin.updateUserById(userId, {
    ban_duration: BLOQUEIO,
  });
  if (error) return { error: `Não foi possível desativar: ${error.message}` };

  revalidar();
  return { ok: true };
}

export async function reativarUsuario(userId: string): Promise<UsuarioState> {
  if (!(await exigirCoordenacao())) return SEM_PERMISSAO;

  const { error } = await db().auth.admin.updateUserById(userId, { ban_duration: "none" });
  if (error) return { error: `Não foi possível reativar: ${error.message}` };

  revalidar();
  return { ok: true };
}
