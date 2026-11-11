"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

// Abre a janela de impressão do navegador (onde também dá para "Salvar como PDF").
export function BotaoImprimir() {
  return (
    <Button size="lg" className="px-4" onClick={() => window.print()}>
      <Printer /> Imprimir ou salvar PDF
    </Button>
  );
}
