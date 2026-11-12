"use client";

import { ErroAmigavel } from "@/components/erro-amigavel";

// Erro inesperado numa tela fora do menu (login, criar senha, impressão).
export default function Erro(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErroAmigavel {...props} telaInteira />;
}
