"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createTurma, type FormState } from "@/lib/actions/turmas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard } from "@/components/ui/section-card";
import { Save } from "lucide-react";
import { ImportarPdf } from "@/components/importar-pdf";
import { CalendarioTurma } from "@/components/calendario-turma";

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
  const caixaCapacidades = useRef<HTMLTextAreaElement>(null);
  // Carga horária controlada: o calendário compara o total de horas com ela.
  const [carga, setCarga] = useState("");

  // Capacidades vindas do PDF: entram no fim da caixa de texto, sem repetir
  // as que já estão lá. O professor ainda pode ajustar antes de criar a turma.
  function receberDoPdf(capacidades: string[]) {
    const caixa = caixaCapacidades.current;
    if (!caixa) return;
    const atuais = caixa.value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const vistas = new Set(atuais.map((l) => l.toLowerCase()));
    const novas = capacidades.filter((c) => !vistas.has(c.toLowerCase()));
    caixa.value = [...atuais, ...novas].join("\n");
    caixa.focus();
  }

  return (
    <form action={formAction} className="space-y-5">
      <SectionCard
        title="Dados da Turma"
        description="Configure a turma uma única vez: dados, período e dias de aula. Os feriados nacionais saem sozinhos; clique em um dia do calendário para ajustar."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1.4fr_1fr_1fr]">
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="curso" className={labelCls}>Curso</Label>
            <Input id="curso" name="curso" required placeholder="Ex.: Técnico em Eletroeletrônica" className={inputCls} defaultValue={state.valores?.curso} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="turma" className={labelCls}>Turma</Label>
            <Input id="turma" name="turma" required placeholder="Ex.: Turma A - Noturno" className={inputCls} defaultValue={state.valores?.turma} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="periodo" className={labelCls}>Período</Label>
            <Input id="periodo" name="periodo" placeholder="Ex.: 2026/1" className={inputCls} defaultValue={state.valores?.periodo} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cargaHoraria" className={labelCls}>Carga horária (h)</Label>
            <Input id="cargaHoraria" name="cargaHoraria" type="number" min="0" placeholder="Ex.: 800" className={inputCls} value={carga} onChange={(e) => setCarga(e.target.value)} />
          </div>
        </div>

        {/* Calendário (obrigatório): período, dias e horas de aula. Os feriados
            nacionais saem sozinhos; um clique no dia ajusta. */}
        <div className="mt-5 border-t pt-5">
          <CalendarioTurma cargaHoraria={Number(carga) || null} rotuloClasse={labelCls} />
        </div>
      </SectionCard>

      <SectionCard
        title={<label htmlFor="capacidades">Capacidades do Curso</label>}
        description="Importe do PDF do Plano de Curso ou cole abaixo as capacidades — uma por linha. Você poderá editar, adicionar ou remover depois."
      >
        <div className="mb-4">
          <ImportarPdf onConfirmar={receberDoPdf} />
        </div>
        <Textarea
          ref={caixaCapacidades}
          id="capacidades"
          defaultValue={state.valores?.capacidades}
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
