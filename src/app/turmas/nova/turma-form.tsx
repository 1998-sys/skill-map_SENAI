"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createTurma, type FormState } from "@/lib/actions/turmas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : "Criar turma"}
    </Button>
  );
}

export function TurmaForm() {
  const [state, formAction] = useActionState<FormState, FormData>(
    createTurma,
    {},
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="curso">Curso</Label>
          <Input id="curso" name="curso" required placeholder="Ex.: Técnico em Eletroeletrônica" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="turma">Turma</Label>
          <Input id="turma" name="turma" required placeholder="Ex.: Turma A - Noturno" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="periodo">Período</Label>
          <Input id="periodo" name="periodo" placeholder="Ex.: 2026/1" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cargaHoraria">Carga horária (h)</Label>
          <Input id="cargaHoraria" name="cargaHoraria" type="number" min="0" placeholder="Ex.: 800" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="capacidades">Capacidades do curso</Label>
        <Textarea
          id="capacidades"
          name="capacidades"
          rows={10}
          placeholder={"Cole aqui as capacidades do Plano de Curso.\nUma por linha — cada linha vira um item individual."}
        />
        <p className="text-xs text-muted-foreground">
          Uma capacidade por linha. Você poderá editar, adicionar ou remover depois.
        </p>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex gap-2">
        <SubmitButton />
      </div>
    </form>
  );
}
