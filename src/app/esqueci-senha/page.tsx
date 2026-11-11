import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { CartaoAcesso } from "@/components/cartao-acesso";
import { FormularioReset } from "./formulario";

export const metadata = { title: "Esqueci minha senha · SkillMap" };

// "Esqueci minha senha" por e-mail: o usuário informa o e-mail e recebe um link
// (template do Supabase, SMTP próprio) que leva a /auth/confirm → /definir-senha.
// Plano B continua: a Coordenação gera uma senha temporária em Usuários.
// (Página pública: liberada no middleware.)
export default function EsqueciSenhaPage() {
  return (
    <CartaoAcesso
      titulo="Esqueci minha senha"
      descricao="Informe o e-mail de acesso. Vamos enviar um link para você criar uma senha nova."
    >
      <FormularioReset />
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Não recebeu? Procure a Coordenação para gerar uma senha temporária.
      </p>
      <Link
        href="/login"
        className={buttonVariants({ variant: "outline-primary", size: "lg", className: "mt-4 h-10 w-full" })}
      >
        Voltar ao login
      </Link>
    </CartaoAcesso>
  );
}
