"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/cliente";

export type SenhaState = { error?: string };

// (Arquivo "use server" só pode exportar funções assíncronas.)
const SENHA_MINIMA = 8;

// O próprio usuário logado define a senha nova (primeiro acesso com senha
// temporária, ou quando quiser trocar). Depois tira a marca "trocar_senha".
export async function definirSenha(
  _prev: SenhaState,
  formData: FormData,
): Promise<SenhaState> {
  const senha = String(formData.get("senha") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "");

  if (senha.length < SENHA_MINIMA) {
    return { error: `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.` };
  }
  if (senha !== confirmacao) {
    return { error: "As duas senhas não são iguais." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) {
    if (error.code === "same_password") {
      return { error: "A senha nova precisa ser diferente da senha temporária." };
    }
    if (error.code === "weak_password") {
      return { error: "Senha fraca. Use letras e números, com pelo menos 8 caracteres." };
    }
    return { error: "Não foi possível salvar a senha. Tente de novo." };
  }

  // A marca fica em app_metadata (só o servidor altera); por isso a chave secreta.
  if (user.app_metadata?.trocar_senha) {
    await db().auth.admin.updateUserById(user.id, {
      app_metadata: { ...user.app_metadata, trocar_senha: false },
    });
  }

  redirect("/dashboard");
}

// ─── Esqueci minha senha (por e-mail) ───────────────────────────────────────

export type ResetState = { error?: string; ok?: boolean };

// Pede ao Supabase o e-mail de redefinição. O link vem do template "Reset
// Password" do painel (padrão SSR, com token_hash) e cai em /auth/confirm,
// que abre a sessão e leva para /definir-senha.
// Sempre responde "ok", exista ou não o e-mail: não revelamos quem tem conta.
export async function solicitarReset(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Informe um e-mail válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error?.code === "over_email_send_rate_limit" || error?.status === 429) {
    return { error: "Muitos pedidos agora. Tente de novo em alguns minutos." };
  }
  // Qualquer outro erro também responde "ok" (não expõe se o e-mail existe).
  return { ok: true };
}
