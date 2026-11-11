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
import { BuscaCurso } from "@/components/busca-curso";
import { capacidadesDoCurso, type CursoCatalogo } from "@/lib/catalogo-cursos";

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

export function TurmaForm({
  professores,
  meuId,
}: {
  professores: { id: string; nome: string }[] | null; // só para a Coordenação
  meuId: string;
}) {
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

  // Curso escolhido no catálogo: preenche carga horária e capacidades do Plano
  // de Curso. Se já houver capacidades digitadas, pergunta antes de trocar.
  function receberDoCatalogo(curso: CursoCatalogo) {
    setCarga(String(curso.cargaHoraria));
    const caixa = caixaCapacidades.current;
    if (!caixa) return;
    const novas = capacidadesDoCurso(curso).join("\n");
    const atuais = caixa.value.trim();
    if (atuais === novas) return;
    if (
      atuais &&
      !window.confirm("Trocar as capacidades da caixa pelas do curso escolhido?")
    ) {
      return;
    }
    caixa.value = novas;
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
            <BuscaCurso id="curso" name="curso" className={inputCls} defaultValue={state.valores?.curso} onEscolher={receberDoCatalogo} />
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

        {professores && (
          <div className="mt-4 space-y-1.5 sm:max-w-md">
            <Label htmlFor="professorId" className={labelCls}>Professor responsável</Label>
            <select
              id="professorId"
              name="professorId"
              defaultValue={state.valores?.professorId || meuId}
              className="h-[42px] w-full rounded-lg border border-input bg-card px-3 text-[15px] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25"
            >
              {professores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                  {p.id === meuId ? " — eu" : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              A turma aparece para o professor escolhido, que registra as aulas.
            </p>
          </div>
        )}

        {/* Calendário (obrigatório): período, dias e horas de aula. Os feriados
            nacionais saem sozinhos; um clique no dia ajusta. */}
        <div className="mt-5 border-t pt-5">
          <CalendarioTurma cargaHoraria={Number(carga) || null} rotuloClasse={labelCls} />
        </div>
      </SectionCard>

      <SectionCard
        title={<label htmlFor="capacidades">Capacidades do Curso</label>}
        description="Ao escolher um curso do catálogo, as capacidades do Plano de Curso entram sozinhas. Se o curso não estiver na lista, importe do PDF ou cole abaixo — uma por linha. Você poderá editar, adicionar ou remover depois."
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
