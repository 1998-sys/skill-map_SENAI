"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Pencil, Save } from "lucide-react";
import { atualizarDadosTurma, type DadosTurmaState } from "@/lib/actions/turmas-gestao";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Valores = { curso: string; turma: string; periodo: string; cargaHoraria: string };

function Salvar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Save /> {pending ? "Salvando..." : "Salvar dados"}
    </Button>
  );
}

// Corrige curso, nome, período e carga horária da turma. Fechado por padrão
// (botão "Editar dados"); usado pelo professor responsável e pela Coordenação.
export function EditarDadosTurma({ turmaId, inicial }: { turmaId: string; inicial: Valores }) {
  const [aberto, setAberto] = useState(false);
  // Ao salvar com sucesso, avisa e fecha o formulário.
  const [estado, acao] = useActionState<DadosTurmaState, FormData>(async (anterior, dados) => {
    const r = await atualizarDadosTurma(anterior, dados);
    if (r.ok) {
      toast.success("Dados da turma atualizados.");
      setAberto(false);
    }
    return r;
  }, {});

  if (!aberto) {
    return (
      <Button type="button" variant="outline-primary" onClick={() => setAberto(true)}>
        <Pencil /> Editar dados
      </Button>
    );
  }

  // Depois de um erro, mantém o que foi digitado (o React limpa o formulário).
  const v = estado.error && estado.valores ? estado.valores : inicial;
  const rotulo = "font-normal text-muted-foreground";

  return (
    <form action={acao} className="w-full space-y-3 rounded-lg border p-4">
      <input type="hidden" name="turmaId" value={turmaId} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1.4fr_1fr_1fr]">
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="ed-curso" className={rotulo}>Curso</Label>
          <Input id="ed-curso" name="curso" required defaultValue={v.curso} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ed-turma" className={rotulo}>Turma</Label>
          <Input id="ed-turma" name="turma" required defaultValue={v.turma} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ed-periodo" className={rotulo}>Período</Label>
          <Input id="ed-periodo" name="periodo" defaultValue={v.periodo} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ed-carga" className={rotulo}>Carga horária (h)</Label>
          <Input id="ed-carga" name="cargaHoraria" type="number" min="0" defaultValue={v.cargaHoraria} className="h-10" />
        </div>
      </div>
      {estado.error && (
        <p role="alert" className="text-sm text-destructive">{estado.error}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <Salvar />
        <Button type="button" variant="ghost" onClick={() => setAberto(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
