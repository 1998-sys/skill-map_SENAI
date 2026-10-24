"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  analisarRegistro,
  salvarAnaliseValidada,
} from "@/lib/actions/analises";
import {
  enviarParaCoordenacao,
  reabrirRegistro,
} from "@/lib/actions/envio";
import {
  Check,
  Pencil,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SectionCard } from "@/components/ui/section-card";
import { Bullets, Secao } from "@/components/analise-secoes";

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
  status,
}: {
  registroId: string;
  capacidades: Capacidade[];
  analise: AnaliseData | null;
  status: "RASCUNHO" | "ENVIADO";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const readOnly = status === "ENVIADO";
  // Leitura por padrão (como na referência); "Editar" abre os campos.
  const [editando, setEditando] = useState(false);

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
    if (readOnly) return;
    setSelecionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function run(fn: () => Promise<{ error?: string; ok?: boolean }>, ok: string) {
    startTransition(async () => {
      const res = await fn();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      router.refresh();
      toast.success(ok);
    });
  }

  // Sem análise: botão para gerar (indisponível se já enviado).
  if (!analise) {
    return (
      <SectionCard
        title="Análise Pedagógica da Turma"
        description="A IA vai relacionar este relato às capacidades da turma e sugerir pontos de atenção e ações para a próxima aula."
      >
        <div className="flex justify-end">
          <Button
            size="lg"
            className="px-4"
            disabled={pending || readOnly}
            onClick={() =>
              run(() => analisarRegistro(registroId), "Análise gerada.")
            }
          >
            <Sparkles />
            {pending ? "Analisando..." : "Analisar com IA"}
          </Button>
        </div>
      </SectionCard>
    );
  }

  const podeEnviar = !readOnly && analise.tipo === "VALIDADA";
  const emEdicao = editando && !readOnly;
  const capsSelecionadas = capacidades.filter((c) => selecionadas.has(c.id));

  return (
    <SectionCard
      title="Análise Pedagógica da Turma"
      description={
        <>
          {analise.tipo === "VALIDADA"
            ? "Versão validada pelo professor"
            : "Versão gerada pela IA — revise e valide antes de enviar"}{" "}
          · v{analise.versao}
        </>
      }
    >
      <div className="divide-y">
        <Secao n={1} titulo="Capacidades identificadas">
          {emEdicao ? (
            <ul className="space-y-2">
              {capacidades.map((c) => (
                <li key={c.id} className="flex items-start gap-2.5 text-[15px]">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 accent-primary"
                    checked={selecionadas.has(c.id)}
                    onChange={() => toggleCap(c.id)}
                    id={`cap-${c.id}`}
                  />
                  <label htmlFor={`cap-${c.id}`}>{c.texto}</label>
                </li>
              ))}
            </ul>
          ) : (
            <Bullets
              itens={capsSelecionadas.map((c) => c.texto)}
              vazio="Nenhuma capacidade identificada."
            />
          )}
        </Secao>

        <Secao n={2} titulo="Pontos positivos">
          {emEdicao ? (
            <Textarea
              rows={4}
              value={positivos}
              onChange={(e) => setPositivos(e.target.value)}
              placeholder="Um por linha"
              className="text-[15px]"
            />
          ) : (
            <Bullets itens={linhasParaArray(positivos)} />
          )}
        </Secao>

        <Secao n={3} titulo="Pontos que merecem atenção">
          {emEdicao ? (
            <Textarea
              rows={4}
              value={atencao}
              onChange={(e) => setAtencao(e.target.value)}
              placeholder="Um por linha"
              className="text-[15px]"
            />
          ) : (
            <Bullets itens={linhasParaArray(atencao)} />
          )}
        </Secao>

        <Secao n={4} titulo="Sugestões para a próxima aula">
          {emEdicao ? (
            <Textarea
              rows={4}
              value={sugestoes}
              onChange={(e) => setSugestoes(e.target.value)}
              placeholder="Uma por linha"
              className="text-[15px]"
            />
          ) : (
            <Bullets itens={linhasParaArray(sugestoes)} numerada />
          )}
        </Secao>

        {(emEdicao || observacoes.trim()) && (
          <Secao n={5} titulo="Observações adicionais">
            {emEdicao ? (
              <Textarea
                rows={3}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="text-[15px]"
              />
            ) : (
              <p className="text-[15px] whitespace-pre-line">{observacoes}</p>
            )}
          </Secao>
        )}
      </div>

      {readOnly ? (
        <div className="mt-2 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Esta análise foi enviada à Coordenação. Para corrigir, reabra o
            registro — o histórico é preservado.
          </p>
          <Button
            variant="outline-primary"
            size="lg"
            disabled={pending}
            onClick={() =>
              run(() => reabrirRegistro(registroId), "Registro reaberto.")
            }
          >
            <RotateCcw /> Reabrir para correção
          </Button>
        </div>
      ) : (
        <div className="mt-2 space-y-3 border-t pt-4">
          <p className="text-xs text-muted-foreground">
            A decisão pedagógica é sua: edite o que for necessário, valide e só
            então envie. A IA não atribui nota nem aprova/reprova.
            {analise.tipo === "IA_ORIGINAL" &&
              " Salve a análise validada para liberar o envio à Coordenação."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline-primary"
              size="lg"
              onClick={() => setEditando((v) => !v)}
            >
              {emEdicao ? <Check /> : <Pencil />}
              {emEdicao ? "Concluir edição" : "Editar"}
            </Button>
            <Button
              variant="outline-primary"
              size="lg"
              disabled={pending}
              onClick={() =>
                run(() => analisarRegistro(registroId), "Nova análise gerada.")
              }
            >
              <RefreshCw /> Gerar novas sugestões
            </Button>
            <Button
              size="lg"
              disabled={pending}
              onClick={() =>
                run(
                  () =>
                    salvarAnaliseValidada({
                      registroId,
                      capacidadeIds: [...selecionadas],
                      pontosPositivos: linhasParaArray(positivos),
                      pontosAtencao: linhasParaArray(atencao),
                      sugestoes: linhasParaArray(sugestoes),
                      observacoesAdicionais: observacoes.trim() || null,
                    }),
                  "Análise validada salva.",
                )
              }
            >
              <Save /> {pending ? "Salvando..." : "Salvar análise validada"}
            </Button>
            {podeEnviar && (
              <Button
                size="lg"
                className="sm:ml-auto"
                disabled={pending}
                onClick={() =>
                  run(
                    () => enviarParaCoordenacao(registroId),
                    "Enviado à Coordenação.",
                  )
                }
              >
                <Send /> Enviar análise para Coordenação
              </Button>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
