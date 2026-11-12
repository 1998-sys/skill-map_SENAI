"use client";

import { ErroAmigavel } from "@/components/erro-amigavel";

// Erro inesperado numa tela interna: o menu continua e só o conteúdo mostra o aviso.
export default function Erro(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErroAmigavel {...props} />;
}
