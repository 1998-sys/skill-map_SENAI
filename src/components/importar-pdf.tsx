"use client";

import { useRef, useState, useTransition } from "react";
import { FileUp, ListChecks, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PensandoIA, SeloIA } from "@/components/ia-escrita";
import { lerPlanoDeCurso } from "@/lib/actions/capacidades-pdf";
import type { UnidadeExtraida } from "@/lib/ia/capacidades-pdf";

// "Importar do PDF": o professor escolhe o PDF do Plano de Curso, a IA lista
// as unidades curriculares e as capacidades, e o professor revisa (edita,
// desmarca) antes de usar. Nada é salvo aqui: quem decide o que fazer com a
// lista é a tela que usa o componente (onConfirmar).

type Item = { texto: string; marcado: boolean; tipo: "tecnica" | "socio" };

const normalizar = (t: string) => t.trim().replace(/\s+/g, " ").toLowerCase();

export function ImportarPdf({
  onConfirmar,
  existentes = [],
}: {
  onConfirmar: (capacidades: string[]) => void | Promise<void>;
  existentes?: string[]; // capacidades já cadastradas (não importa de novo)
}) {
  const [aberto, setAberto] = useState(false);
  const [lendo, startLeitura] = useTransition();
  const [salvando, startSalvar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [unidades, setUnidades] = useState<UnidadeExtraida[] | null>(null);
  const [escolhida, setEscolhida] = useState<number | null>(null);
  const [itens, setItens] = useState<Item[]>([]);
  const inputArquivo = useRef<HTMLInputElement>(null);

  const jaExiste = new Set(existentes.map(normalizar));

  function fechar() {
    setAberto(false);
    setErro(null);
    setUnidades(null);
    setEscolhida(null);
    setItens([]);
  }

  function ler(arquivo: File) {
    setErro(null);
    setUnidades(null);
    setEscolhida(null);
    const dados = new FormData();
    dados.set("pdf", arquivo);
    startLeitura(async () => {
      const r = await lerPlanoDeCurso(dados);
      if (r.error) {
        setErro(r.error);
        return;
      }
      const lista = r.unidades ?? [];
      setUnidades(lista);
      if (lista.length === 1) escolher(lista, 0);
    });
  }

  function escolher(lista: UnidadeExtraida[], i: number) {
    setEscolhida(i);
    const u = lista[i];
    setItens([
      ...u.tecnicas.map((texto) => ({ texto, tipo: "tecnica" as const, marcado: !jaExiste.has(normalizar(texto)) })),
      ...u.socioemocionais.map((texto) => ({ texto, tipo: "socio" as const, marcado: !jaExiste.has(normalizar(texto)) })),
    ]);
  }

  function alterar(i: number, mudanca: Partial<Item>) {
    setItens((atual) => atual.map((it, j) => (j === i ? { ...it, ...mudanca } : it)));
  }

  const selecionadas = itens.filter((it) => it.marcado && it.texto.trim());

  function confirmar() {
    startSalvar(async () => {
      await onConfirmar(selecionadas.map((it) => it.texto.trim()));
      fechar();
    });
  }

  if (!aberto) {
    return (
      <Button type="button" variant="outline-primary" onClick={() => setAberto(true)}>
        <FileUp /> Importar do PDF
      </Button>
    );
  }

  return (
    <div className="w-full space-y-4 rounded-lg border bg-muted/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-title">Importar capacidades do Plano de Curso</h3>
          <p className="text-sm text-muted-foreground">
            A IA lê o PDF e sugere as capacidades. Você revisa antes de usar. O PDF não fica
            guardado.
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={fechar} aria-label="Fechar importação">
          <X />
        </Button>
      </div>

      {/* 1. Arquivo */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputArquivo}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          id="pdf-plano-curso"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) ler(f);
            e.target.value = ""; // permite escolher o mesmo arquivo de novo
          }}
        />
        <Button
          type="button"
          onClick={() => inputArquivo.current?.click()}
          disabled={lendo || salvando}
        >
          <FileUp /> {unidades ? "Escolher outro PDF" : "Escolher o PDF"}
        </Button>
        <span className="text-xs text-muted-foreground">PDF de até 4 MB.</span>
      </div>

      {lendo && (
        <PensandoIA>A IA está lendo o Plano de Curso (pode levar até 1 minuto)</PensandoIA>
      )}
      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}

      {/* 2. Unidade curricular */}
      {unidades && unidades.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-semibold">
            Qual unidade curricular é a desta turma? ({unidades.length} encontradas)
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {unidades.map((u, i) => (
              <label
                key={`${u.nome}-${i}`}
                className={`flex cursor-pointer items-start gap-2 rounded-md border bg-card p-3 text-sm ${
                  escolhida === i ? "border-primary ring-2 ring-primary/20" : ""
                }`}
              >
                <input
                  type="radio"
                  name="unidade-curricular"
                  className="mt-1 accent-primary"
                  checked={escolhida === i}
                  onChange={() => escolher(unidades, i)}
                />
                <span>
                  <span className="font-medium">{u.nome}</span>
                  <span className="block text-xs text-muted-foreground">
                    {u.tecnicas.length} técnicas/básicas · {u.socioemocionais.length} socioemocionais
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* 3. Revisão */}
      {escolhida !== null && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <SeloIA>Sugerido pela IA</SeloIA>
            <span className="text-xs text-muted-foreground">
              Confira com o Plano de Curso: edite o texto ou desmarque o que não for usar.
            </span>
          </div>
          {(
            [
              ["tecnica", "Capacidades técnicas / básicas"],
              ["socio", "Capacidades socioemocionais"],
            ] as const
          ).map(([tipo, titulo]) => {
            const doTipo = itens.map((it, i) => ({ it, i })).filter(({ it }) => it.tipo === tipo);
            if (doTipo.length === 0) return null;
            return (
              <div key={tipo} className="space-y-2">
                <p className="text-sm font-semibold">{titulo}</p>
                <ul className="space-y-2">
                  {doTipo.map(({ it, i }) => {
                    const repetida = jaExiste.has(normalizar(it.texto));
                    return (
                      <li key={i} className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          className="mt-3 size-4 shrink-0 accent-primary"
                          checked={it.marcado}
                          onChange={(e) => alterar(i, { marcado: e.target.checked })}
                          aria-label={`Usar a capacidade ${i + 1}`}
                        />
                        <div className="min-w-0 flex-1">
                          {/* Cresce com o texto: o professor precisa ler a capacidade inteira. */}
                          <textarea
                            value={it.texto}
                            rows={1}
                            onChange={(e) => alterar(i, { texto: e.target.value })}
                            className={`field-sizing-content min-h-10 w-full resize-none rounded-md border border-input bg-card px-3 py-2 text-[15px] leading-snug outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 ${
                              it.marcado ? "" : "text-muted-foreground line-through"
                            }`}
                            aria-label={`Texto da capacidade ${i + 1}`}
                          />
                          {repetida && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Já cadastrada nesta turma.
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={confirmar} disabled={salvando || selecionadas.length === 0}>
              <ListChecks />
              {salvando ? "Salvando..." : `Usar estas capacidades (${selecionadas.length})`}
            </Button>
            <Button type="button" variant="ghost" onClick={fechar} disabled={salvando}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
