"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
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
import { CursorIA, PensandoIA, SeloIA, useEscritaFluida } from "@/components/ia-escrita";

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

// Registros cuja análise acabou de ser gerada pela IA nesta aba: o painel que
// monta depois do refresh escreve o resultado de forma fluida. Fica em memória
// (some ao recarregar a página), então uma visita normal mostra tudo direto.
const recemGeradas = new Set<string>();

type ListaChave = "caps" | "pos" | "at" | "sug" | "obs";
const ORDEM: ListaChave[] = ["caps", "pos", "at", "sug", "obs"];

// Corta as listas para mostrar só os `visivel` primeiros caracteres, em ordem,
// e indica em qual lista está o cursor.
function revelar(listas: Record<ListaChave, string[]>, visivel: number) {
  let resto = visivel;
  let cursor: ListaChave | null = null;
  const cortadas = {} as Record<ListaChave, string[]>;
  for (const k of ORDEM) {
    cortadas[k] = [];
    for (const t of listas[k]) {
      if (resto <= 0) break;
      cortadas[k].push(t.slice(0, resto));
      resto -= t.length;
      if (resto <= 0) cursor = k;
    }
  }
  return { cortadas, cursor };
}

export function AnalisePanel({
  registroId,
  capacidades,
  analise,
  status,
  gerarAoAbrir = false,
}: {
  registroId: string;
  capacidades: Capacidade[];
  analise: AnaliseData | null;
  status: "RASCUNHO" | "ENVIADO";
  /** Veio do "Analisar com IA" do Registro Diário: gera a análise ao abrir. */
  gerarAoAbrir?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
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

  // Chama a IA; ao voltar, marca o registro para a escrita fluida do resultado.
  // Chegou pelo "Analisar com IA" do Registro Diário: já abre "analisando".
  const gerarAgora = gerarAoAbrir && !analise && !readOnly;
  const [analisando, setAnalisando] = useState(gerarAgora);
  function analisar(ok: string) {
    setAnalisando(true);
    chamarIA(ok);
  }
  function chamarIA(ok: string) {
    startTransition(async () => {
      const res = await analisarRegistro(registroId);
      setAnalisando(false);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      recemGeradas.add(registroId);
      router.refresh();
      toast.success(ok);
    });
  }

  const [animar] = useState(() => recemGeradas.has(registroId));
  useEffect(() => {
    recemGeradas.delete(registroId);
  }, [registroId]);

  // Dispara uma vez ao montar (o ref evita a segunda execução do efeito no
  // modo estrito) e limpa o ?gerar=1 da URL.
  const disparou = useRef(false);
  useEffect(() => {
    if (!gerarAoAbrir || disparou.current) return;
    disparou.current = true;
    router.replace(pathname, { scroll: false });
    if (gerarAgora) chamarIA("Análise gerada.");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só ao montar
  }, []);

  const emEdicao = editando && !readOnly;
  const capsSelecionadas = capacidades.filter((c) => selecionadas.has(c.id));
  const listas: Record<ListaChave, string[]> = {
    caps: capsSelecionadas.map((c) => c.texto),
    pos: linhasParaArray(positivos),
    at: linhasParaArray(atencao),
    sug: linhasParaArray(sugestoes),
    obs: observacoes.trim() ? [observacoes.trim()] : [],
  };
  const total = ORDEM.reduce(
    (s, k) => s + listas[k].reduce((a, t) => a + t.length, 0),
    0,
  );
  const { visivel, escrevendo } = useEscritaFluida(total, {
    ativo: animar && !emEdicao,
  });
  const { cortadas, cursor } = revelar(listas, visivel);
  const fim = (k: ListaChave) => (escrevendo && cursor === k ? <CursorIA /> : null);
  const vazio = (texto: string) => (escrevendo ? null : texto);

  // Sem análise: botão para gerar (indisponível se já enviado).
  if (!analise) {
    return (
      <SectionCard
        title="Análise Pedagógica da Turma"
        description="A IA vai relacionar este relato às capacidades da turma e sugerir pontos de atenção e ações para a próxima aula."
      >
        {analisando ? (
          <PensandoIA>
            A IA está lendo o relato e relacionando às capacidades do curso
          </PensandoIA>
        ) : (
          <div className="flex justify-end">
            <Button
              size="lg"
              className="px-4"
              disabled={pending || readOnly}
              onClick={() => analisar("Análise gerada.")}
            >
              <Sparkles />
              Analisar com IA
            </Button>
          </div>
        )}
      </SectionCard>
    );
  }

  const podeEnviar = !readOnly && analise.tipo === "VALIDADA";

  // Gerando novas sugestões: a análise anterior sai da tela (fica em branco)
  // até a nova chegar. Ela continua salva no banco (histórico de versões) e
  // volta a aparecer se a geração falhar.
  if (analisando) {
    return (
      <SectionCard
        title="Análise Pedagógica da Turma"
        description={
          <span className="flex flex-wrap items-center gap-2">
            <SeloIA />
            <span>Gerando uma nova análise…</span>
          </span>
        }
      >
        <PensandoIA>A IA está lendo o relato e escrevendo novas sugestões</PensandoIA>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Análise Pedagógica da Turma"
      description={
        <span className="flex flex-wrap items-center gap-2">
          {analise.tipo === "VALIDADA" ? (
            <span>Versão validada pelo professor · v{analise.versao}</span>
          ) : (
            <>
              <SeloIA />
              <span>
                {escrevendo
                  ? "A IA está escrevendo a análise…"
                  : "Revise e valide antes de enviar"}{" "}
                · v{analise.versao}
              </span>
            </>
          )}
        </span>
      }
    >
      <div className="divide-y" aria-live="polite" aria-busy={escrevendo}>
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
              itens={cortadas.caps}
              vazio={vazio("Nenhuma capacidade identificada.")}
              fim={fim("caps")}
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
            <Bullets itens={cortadas.pos} vazio={vazio("Nenhum item.")} fim={fim("pos")} />
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
            <Bullets itens={cortadas.at} vazio={vazio("Nenhum item.")} fim={fim("at")} />
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
            <Bullets
              itens={cortadas.sug}
              numerada
              vazio={vazio("Nenhum item.")}
              fim={fim("sug")}
            />
          )}
        </Secao>

        {(emEdicao || cortadas.obs.length > 0) && (
          <Secao n={5} titulo="Observações adicionais">
            {emEdicao ? (
              <Textarea
                rows={3}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="text-[15px]"
              />
            ) : (
              <p className="text-[15px] whitespace-pre-line">
                {cortadas.obs[0]}
                {fim("obs")}
              </p>
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
              onClick={() => analisar("Nova análise gerada.")}
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
