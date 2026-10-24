"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  analisarRegistro,
  salvarAnaliseValidada,
} from "@/lib/actions/analises";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Capacidade = { id: string; texto: string };
export type AnaliseData = {
  tipo: "IA_ORIGINAL" | "VALIDADA";
  versao: number;
  capacidadeIds: string[];
  pontosPositivos: string[];
  pontosAtencao: string[];
  sugestoes: string[];
  observacoesAdicionais: string | null;
};

const linhasParaArray = (s: string) =>
  s.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

export function AnalisePanel({
  registroId,
  capacidades,
  analise,
}: {
  registroId: string;
  capacidades: Capacidade[];
  analise: AnaliseData | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Estado editável (inicializado da análise; remonta via key no pai).
  const [selecionadas, setSelecionadas] = useState<Set<string>>(
    () => new Set(analise?.capacidadeIds ?? []),
  );
  const [positivos, setPositivos] = useState(
    () => (analise?.pontosPositivos ?? []).join("\n"),
  );
  const [atencao, setAtencao] = useState(
    () => (analise?.pontosAtencao ?? []).join("\n"),
  );
  const [sugestoes, setSugestoes] = useState(
    () => (analise?.sugestoes ?? []).join("\n"),
  );
  const [observacoes, setObservacoes] = useState(
    () => analise?.observacoesAdicionais ?? "",
  );

  function toggleCap(id: string) {
    setSelecionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function analisar(msg: string) {
    startTransition(async () => {
      const res = await analisarRegistro(registroId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      router.refresh();
      toast.success(msg);
    });
  }

  function salvar() {
    startTransition(async () => {
      const res = await salvarAnaliseValidada({
        registroId,
        capacidadeIds: [...selecionadas],
        pontosPositivos: linhasParaArray(positivos),
        pontosAtencao: linhasParaArray(atencao),
        sugestoes: linhasParaArray(sugestoes),
        observacoesAdicionais: observacoes.trim() || null,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      router.refresh();
      toast.success("Análise validada salva.");
    });
  }

  // Sem análise ainda: botão para gerar.
  if (!analise) {
    return (
      <section className="mt-8 rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium">Análise pedagógica com IA</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A IA vai relacionar este relato às capacidades da turma e sugerir
              pontos de atenção e ações para a próxima aula.
            </p>
          </div>
          <Button disabled={pending} onClick={() => analisar("Análise gerada.")}>
            {pending ? "Analisando..." : "Analisar com IA"}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8 space-y-5 rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">Análise pedagógica com IA</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {analise.tipo === "VALIDADA"
              ? "Versão validada pelo professor"
              : "Versão gerada pela IA (revise e valide)"}{" "}
            · v{analise.versao}
          </p>
        </div>
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => analisar("Nova análise gerada.")}
        >
          {pending ? "..." : "Analisar novamente"}
        </Button>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Capacidades identificadas</h3>
        <ul className="space-y-1.5">
          {capacidades.map((c) => (
            <li key={c.id} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={selecionadas.has(c.id)}
                onChange={() => toggleCap(c.id)}
                id={`cap-${c.id}`}
              />
              <label htmlFor={`cap-${c.id}`}>{c.texto}</label>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <h3 className="text-sm font-medium">Pontos positivos</h3>
          <Textarea
            rows={5}
            value={positivos}
            onChange={(e) => setPositivos(e.target.value)}
            placeholder="Um por linha"
          />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-sm font-medium">Pontos de atenção</h3>
          <Textarea
            rows={5}
            value={atencao}
            onChange={(e) => setAtencao(e.target.value)}
            placeholder="Um por linha"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-sm font-medium">Sugestões para a próxima aula</h3>
        <Textarea
          rows={5}
          value={sugestoes}
          onChange={(e) => setSugestoes(e.target.value)}
          placeholder="Uma por linha"
        />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-sm font-medium">Observações adicionais</h3>
        <Textarea
          rows={3}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        A decisão pedagógica é sua: edite o que for necessário antes de validar.
        A IA não atribui nota nem aprova/reprova.
      </p>

      <div className="flex gap-2">
        <Button disabled={pending} onClick={salvar}>
          {pending ? "Salvando..." : "Salvar análise validada"}
        </Button>
      </div>
    </section>
  );
}
