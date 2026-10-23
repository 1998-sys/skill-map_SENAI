"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { RegistroFormState } from "@/lib/actions/registros";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Defaults = {
  data?: string;
  tema?: string;
  textoTrabalhado?: string;
  textoDesempenho?: string;
  textoObservacoes?: string;
};

type Action = (
  prev: RegistroFormState,
  formData: FormData,
) => Promise<RegistroFormState>;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : label}
    </Button>
  );
}

export function RegistroForm({
  action,
  hidden,
  defaults = {},
  submitLabel = "Salvar",
  readOnly = false,
}: {
  action: Action;
  hidden: Record<string, string>;
  defaults?: Defaults;
  submitLabel?: string;
  readOnly?: boolean;
}) {
  const [state, formAction] = useActionState<RegistroFormState, FormData>(
    action,
    {},
  );

  return (
    <form action={formAction} className="space-y-5">
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="data">Data da aula</Label>
          <Input
            id="data"
            name="data"
            type="date"
            defaultValue={defaults.data}
            disabled={readOnly}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tema">Tema / aula (opcional)</Label>
          <Input
            id="tema"
            name="tema"
            defaultValue={defaults.tema}
            disabled={readOnly}
            placeholder="Ex.: Lei de Ohm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="textoTrabalhado">O que foi trabalhado</Label>
        <Textarea
          id="textoTrabalhado"
          name="textoTrabalhado"
          rows={4}
          required
          defaultValue={defaults.textoTrabalhado}
          disabled={readOnly}
          placeholder="Descreva, em linguagem natural, o conteúdo e as atividades da aula."
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="textoDesempenho">Desempenho observado da turma</Label>
        <Textarea
          id="textoDesempenho"
          name="textoDesempenho"
          rows={4}
          defaultValue={defaults.textoDesempenho}
          disabled={readOnly}
          placeholder="Como a turma respondeu? Dificuldades, participação, avanços..."
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="textoObservacoes">Outras observações (opcional)</Label>
        <Textarea
          id="textoObservacoes"
          name="textoObservacoes"
          rows={3}
          defaultValue={defaults.textoObservacoes}
          disabled={readOnly}
          placeholder="Qualquer observação adicional relevante."
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.ok && <p className="text-sm text-emerald-600">Alterações salvas.</p>}

      {!readOnly && (
        <div className="flex gap-2">
          <SubmitButton label={submitLabel} />
        </div>
      )}
    </form>
  );
}
