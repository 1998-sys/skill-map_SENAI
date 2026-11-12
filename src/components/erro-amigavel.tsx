"use client";

import { useEffect } from "react";
import { House, RotateCcw, TriangleAlert } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

// Tela de erro inesperado, em português e sem termos técnicos. O Next chama
// os arquivos error.tsx quando uma página falha; "Tentar de novo" refaz só
// aquela parte. O código (digest) ajuda a achar o erro nos logs da Vercel.
export function ErroAmigavel({
  error,
  reset,
  telaInteira = false,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  telaInteira?: boolean;
}) {
  useEffect(() => {
    console.error("[erro na tela]", error);
  }, [error]);

  // Sem internet o problema não é do sistema: a mensagem muda.
  const semInternet = typeof navigator !== "undefined" && navigator.onLine === false;

  return (
    <main
      className={`mx-auto flex w-full max-w-xl flex-1 items-center p-4 sm:p-6 ${telaInteira ? "min-h-screen" : ""}`}
    >
      <section role="alert" className="w-full rounded-xl border bg-card p-6 text-center sm:p-8">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-soft text-primary">
          <TriangleAlert className="size-7" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-extrabold tracking-tight text-title sm:text-2xl">
          {semInternet ? "Sem conexão com a internet" : "Algo não saiu como esperado"}
        </h1>
        <div className="mx-auto mt-3 h-1 w-14 bg-primary" aria-hidden="true" />
        <p className="mt-4 text-sm text-muted-foreground">
          {semInternet
            ? "Confira a sua conexão e tente de novo. O que você já salvou continua guardado."
            : "Não conseguimos abrir esta tela agora. O que você já salvou continua guardado. Tente de novo; se o problema continuar, avise a Coordenação."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button size="lg" onClick={reset}>
            <RotateCcw /> Tentar de novo
          </Button>
          {/* <a> comum: recarrega tudo do zero, mesmo se o erro travou a navegação. */}
          <a href="/dashboard" className={buttonVariants({ variant: "outline-primary", size: "lg" })}>
            <House /> Voltar ao início
          </a>
        </div>
        {error.digest && (
          <p className="mt-5 text-xs text-muted-foreground">
            Código para o suporte: <span className="font-mono">{error.digest}</span>
          </p>
        )}
      </section>
    </main>
  );
}
