import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Link do e-mail "Esqueci minha senha" (template do Supabase, padrão SSR):
//   /auth/confirm?token_hash=...&type=recovery&next=/definir-senha
// verifyOtp confere o token e abre a sessão (cookies); por usar token_hash, o
// link funciona mesmo aberto em outro navegador ou no celular.
// /auth/* já é público no middleware.

// Só caminhos internos: "/algo", nunca "//site" nem "https://site".
function destinoSeguro(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")
    ? next
    : "/definir-senha";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type");
  const next = destinoSeguro(searchParams.get("next"));

  // Por enquanto só redefinição de senha (convite por e-mail fica para depois).
  if (tokenHash && tipo === "recovery") {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/login?erro=link-invalido`);
}
