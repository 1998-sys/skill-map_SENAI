"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
type Resultado = { error?: string; ok?: boolean };

// Botão de ação sensível com confirmação em dois passos, na própria linha
// (sem modal): 1º clique mostra o aviso + "Confirmar"/"Cancelar".
// Usado para excluir (arquivar) e restaurar turmas e registros.
export function BotaoConfirmar({
  acao,
  rotulo,
  aviso,
  sucesso,
  redirecionarPara,
  tipo = "excluir",
  icone,
}: {
  acao: () => Promise<Resultado>; // Server Action já com o id (bind)
  rotulo: string;
  aviso: string;
  sucesso: string;
  redirecionarPara?: string;
  tipo?: "excluir" | "restaurar";
  icone?: React.ComponentType; // troca o ícone padrão (lixeira / restaurar)
}) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [pendente, startTransition] = useTransition();
  const Icone = icone ?? (tipo === "excluir" ? Trash2 : RotateCcw);

  function executar() {
    startTransition(async () => {
      const r = await acao();
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success(sucesso);
      setConfirmando(false);
      if (redirecionarPara) router.push(redirecionarPara);
      else router.refresh();
    });
  }

  if (!confirmando) {
    return (
      <Button
        type="button"
        variant={tipo === "excluir" ? "destructive" : "outline-primary"}
        onClick={() => setConfirmando(true)}
      >
        <Icone /> {rotulo}
      </Button>
    );
  }

  return (
    <div
      role="alertdialog"
      aria-label={rotulo}
      className="flex max-w-md flex-col gap-2 rounded-lg border border-destructive/30 bg-brand-soft p-3 text-sm"
    >
      <p>{aviso}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={tipo === "excluir" ? "destructive" : "default"}
          onClick={executar}
          disabled={pendente}
          autoFocus
        >
          <Icone /> {pendente ? "Aguarde..." : `Confirmar: ${rotulo.toLowerCase()}`}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setConfirmando(false)}
          disabled={pendente}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
