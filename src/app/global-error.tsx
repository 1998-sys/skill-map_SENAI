"use client";

import { ErroAmigavel } from "@/components/erro-amigavel";
import "./globals.css";

// Último recurso: erro no próprio layout raiz. Precisa trazer <html> e <body>,
// porque substitui a página inteira.
export default function ErroGlobal(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <ErroAmigavel {...props} telaInteira />
      </body>
    </html>
  );
}
