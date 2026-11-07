"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarioTurma, type CalendarioInicial } from "@/components/calendario-turma";
import { salvarCalendario } from "@/lib/actions/turmas";

// Formulário do calendário na tela da turma: o editor + "Salvar calendário".
export function CalendarioForm({
  turmaId,
  inicial,
  cargaHoraria,
}: {
  turmaId: string;
  inicial: CalendarioInicial;
  cargaHoraria: number | null;
}) {
  const [estado, acao, pendente] = useActionState(salvarCalendario, {});

  useEffect(() => {
    if (estado.ok) toast.success("Calendário salvo.");
  }, [estado]);

  return (
    <form action={acao} className="space-y-4">
      <input type="hidden" name="turmaId" value={turmaId} />
      <CalendarioTurma inicial={inicial} cargaHoraria={cargaHoraria} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={pendente}>
          <Save /> {pendente ? "Salvando..." : "Salvar calendário"}
        </Button>
        {estado.error && (
          <p role="alert" className="text-sm text-destructive">
            {estado.error}
          </p>
        )}
      </div>
    </form>
  );
}
