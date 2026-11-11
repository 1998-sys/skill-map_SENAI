"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

// Aviso quando o link do e-mail "Esqueci minha senha" venceu ou já foi usado
// (/auth/confirm manda para /login?erro=link-invalido).
export function AvisoLinkInvalido() {
  const parametros = useSearchParams();
  if (parametros.get("erro") !== "link-invalido") return null;
  return (
    <p role="alert" className="mb-4 rounded-md bg-warning-soft px-3 py-2 text-sm text-warning">
      O link expirou ou já foi usado. Peça um novo em{" "}
      <Link href="/esqueci-senha" className="font-semibold underline underline-offset-2">
        Esqueci minha senha
      </Link>
      .
    </p>
  );
}
