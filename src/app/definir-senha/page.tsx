import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { CartaoAcesso } from "@/components/cartao-acesso";
import { FormularioSenha } from "./formulario";

export const metadata = { title: "Criar senha · SkillMap" };

// Fora de (app)/ de propósito: o layout de lá manda para cá quem ainda tem
// senha temporária — se esta página estivesse lá dentro, entraria em loop.
export default async function DefinirSenhaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const obrigatoria = Boolean(user.app_metadata?.trocar_senha);

  return (
    <CartaoAcesso
      titulo={obrigatoria ? "Crie sua senha" : "Trocar senha"}
      descricao={
        obrigatoria
          ? "Você entrou com uma senha temporária. Crie uma senha só sua para continuar."
          : `Defina uma nova senha para ${user.email}.`
      }
    >
      <FormularioSenha />
      {!obrigatoria && (
        <Link
          href="/dashboard"
          className="mt-4 block text-center text-sm text-muted-foreground hover:underline"
        >
          Cancelar
        </Link>
      )}
    </CartaoAcesso>
  );
}
