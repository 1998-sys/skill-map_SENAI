"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { UserRoundCog } from "lucide-react";
import { realocarTurma, type GestaoState } from "@/lib/actions/turmas-gestao";
import { Button } from "@/components/ui/button";

type Opcao = { id: string; nome: string; coordenacao: boolean };

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline-primary" className="h-10 px-4" disabled={pending}>
      <UserRoundCog /> {pending ? "Realocando..." : "Realocar"}
    </Button>
  );
}

// Coordenação troca o professor responsável pela turma. Registros, rascunhos
// e histórico vão junto; o novo professor passa a ver e editar a turma.
export function RealocarProfessor({
  turmaId,
  atualId,
  opcoes,
}: {
  turmaId: string;
  atualId: string;
  opcoes: Opcao[];
}) {
  const [estado, acao] = useActionState<GestaoState, FormData>(realocarTurma, {});

  useEffect(() => {
    if (estado.ok) toast.success("Turma realocada para o novo professor.");
    else if (estado.error) toast.error(estado.error);
  }, [estado]);

  return (
    <form action={acao} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <input type="hidden" name="turmaId" value={turmaId} />
      <div className="flex flex-1 flex-col gap-1.5">
        <label htmlFor="professorId" className="text-sm text-muted-foreground">
          Professor responsável
        </label>
        <select
          id="professorId"
          name="professorId"
          defaultValue={atualId}
          key={atualId} // volta ao atual depois de realocar
          className="h-10 rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25"
        >
          {opcoes.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome}
              {o.coordenacao ? " (Coordenação)" : ""}
              {o.id === atualId ? " — atual" : ""}
            </option>
          ))}
        </select>
      </div>
      <BotaoSalvar />
    </form>
  );
}
