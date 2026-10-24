"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Save } from "lucide-react";
import type { RegistroFormState } from "@/lib/actions/registros";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard } from "@/components/ui/section-card";
import { InfoField } from "@/components/ui/info-field";

type Defaults = {
  data?: string;
  tema?: string;
  textoTrabalhado?: string;
  textoDesempenho?: string;
  textoObservacoes?: string;
};

// Dados de contexto exibidos (somente leitura) no topo do registro.
type Contexto = { curso: string; turma: string; professor: string };

type Action = (
  prev: RegistroFormState,
  formData: FormData,
) => Promise<RegistroFormState>;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="px-4">
      <Save />
      {pending ? "Salvando..." : label}
    </Button>
  );
}

// Título do cartão que também é o rótulo do campo.
function CardLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return <label htmlFor={htmlFor}>{children}</label>;
}

// Registro enviado: campos desabilitados, mas legíveis (sem o esmaecido padrão).
const roCls =
  "disabled:cursor-default disabled:opacity-100 disabled:bg-muted/60 disabled:placeholder:text-transparent";
const textareaCls = `text-[15px] leading-relaxed ${roCls}`;

export function RegistroForm({
  action,
  hidden,
  contexto,
  defaults = {},
  submitLabel = "Salvar",
  readOnly = false,
}: {
  action: Action;
  hidden: Record<string, string>;
  contexto: Contexto;
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

      <SectionCard title="Acompanhamento da Turma">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1.3fr_2fr_1.4fr]">
          <InfoField label="Curso" value={contexto.curso} />
          <InfoField label="Turma" value={contexto.turma} />
          <InfoField label="Professor" value={contexto.professor} />
          <div className="space-y-1.5">
            <Label htmlFor="data" className="font-normal text-muted-foreground">
              Data
            </Label>
            <Input
              id="data"
              name="data"
              type="date"
              defaultValue={defaults.data}
              disabled={readOnly}
              className={`h-[42px] bg-muted text-[15px] ${roCls}`}
            />
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <Label htmlFor="tema" className="font-normal text-muted-foreground">
            Aula / Tema (opcional)
          </Label>
          <Input
            id="tema"
            name="tema"
            defaultValue={defaults.tema}
            disabled={readOnly}
            placeholder="Ex.: Partida direta"
            className={`h-[42px] text-[15px] ${roCls}`}
          />
        </div>
      </SectionCard>

      <SectionCard
        title={<CardLabel htmlFor="textoTrabalhado">O que foi trabalhado hoje?</CardLabel>}
      >
        <Textarea
          id="textoTrabalhado"
          name="textoTrabalhado"
          rows={4}
          required
          defaultValue={defaults.textoTrabalhado}
          disabled={readOnly}
          className={textareaCls}
          placeholder="Descreva, em linguagem natural, o conteúdo e as atividades da aula."
        />
      </SectionCard>

      <SectionCard
        title={<CardLabel htmlFor="textoDesempenho">Como foi o desempenho da turma?</CardLabel>}
      >
        <Textarea
          id="textoDesempenho"
          name="textoDesempenho"
          rows={4}
          defaultValue={defaults.textoDesempenho}
          disabled={readOnly}
          className={textareaCls}
          placeholder="Como a turma respondeu? Dificuldades, participação, avanços..."
        />
      </SectionCard>

      <SectionCard
        title={<CardLabel htmlFor="textoObservacoes">Outras observações</CardLabel>}
      >
        <Textarea
          id="textoObservacoes"
          name="textoObservacoes"
          rows={3}
          defaultValue={defaults.textoObservacoes}
          disabled={readOnly}
          className={textareaCls}
          placeholder="Qualquer observação adicional relevante (opcional)."
        />

        {(state.error || state.ok || !readOnly) && (
          <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
            {state.error && (
              <p className="mr-auto text-sm text-destructive">{state.error}</p>
            )}
            {state.ok && (
              <p className="mr-auto text-sm text-[#2e9e54]">Alterações salvas.</p>
            )}
            {!readOnly && <SubmitButton label={submitLabel} />}
          </div>
        )}
      </SectionCard>
    </form>
  );
}
