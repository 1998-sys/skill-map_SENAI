"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createTurma, type FormState } from "@/lib/actions/turmas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard } from "@/components/ui/section-card";
import { Save } from "lucide-react";

const labelCls = "font-normal text-muted-foreground";
const inputCls = "h-[42px] text-[15px]";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="px-4" disabled={pending}>
      <Save />
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
      <SectionCard
        title="Dados da Turma"
        description="Configure a turma uma única vez e informe as capacidades que a IA vai usar."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1.4fr_1fr_1fr]">
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="curso" className={labelCls}>Curso</Label>
            <Input id="curso" name="curso" required placeholder="Ex.: Técnico em Eletroeletrônica" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="turma" className={labelCls}>Turma</Label>
            <Input id="turma" name="turma" required placeholder="Ex.: Turma A - Noturno" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="periodo" className={labelCls}>Período</Label>
            <Input id="periodo" name="periodo" placeholder="Ex.: 2026/1" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cargaHoraria" className={labelCls}>Carga horária (h)</Label>
            <Input id="cargaHoraria" name="cargaHoraria" type="number" min="0" placeholder="Ex.: 800" className={inputCls} />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title={<label htmlFor="capacidades">Capacidades do Curso</label>}
        description="Cole abaixo as capacidades previstas no Plano de Curso — uma por linha. Você poderá editar, adicionar ou remover depois."
      >
        <Textarea
          id="capacidades"
          name="capacidades"
          rows={10}
          className="min-h-56 text-[15px] leading-relaxed"
          placeholder={"1. Interpretar diagramas elétricos\n2. Identificar componentes\n3. Montar circuitos"}
        />

        <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
          {state.error && (
            <p className="mr-auto text-sm text-destructive">{state.error}</p>
          )}
          <SubmitButton />
        </div>
      </SectionCard>
    </form>
  );
}
