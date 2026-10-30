import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { CartaoAcesso } from "@/components/cartao-acesso";

export const metadata = { title: "Esqueci minha senha · SkillMap" };

// Versão sem e-mail: quem gera a senha temporária é a Coordenação.
// (Página pública: liberada no middleware.)
export default function EsqueciSenhaPage() {
  return (
    <CartaoAcesso
      titulo="Esqueci minha senha"
      descricao="A redefinição de senha é feita pela Coordenação do curso."
    >
      <ol className="list-decimal space-y-2 pl-5 text-sm">
        <li>Procure a Coordenação e informe o seu e-mail de acesso.</li>
        <li>A Coordenação gera uma <strong>senha temporária</strong> para você.</li>
        <li>Entre com ela: o SkillMap vai pedir para você criar uma senha nova.</li>
      </ol>
      <Link
        href="/login"
        className={buttonVariants({ size: "lg", className: "mt-6 h-10 w-full" })}
      >
        Voltar ao login
      </Link>
    </CartaoAcesso>
  );
}
