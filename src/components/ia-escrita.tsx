"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";

// Escrita fluida para textos gerados por IA: o texto aparece aos poucos, em
// ritmo natural (palavra a palavra, com pausas curtas na pontuação), como nos
// assistentes de IA — deixa claro que é uma resposta gerada. Não é animação de
// movimento, então vale mesmo com "reduzir movimento" do sistema.

/** Ritmo base, em caracteres por segundo. */
const CPS = 100;
/** Texto completo longo acelera para não passar disso (segundos). */
const DURACAO_MAX = 9;
/** Em streaming, o texto acumulado é alcançado em até ~N segundos. */
const ALCANCE_STREAM = 4;
/** Pausas (ms) depois de pontuação e quebras de linha. */
const PAUSA: Record<string, number> = {
  ".": 200, "!": 200, "?": 200, ":": 140, ";": 140, ",": 70, "\n": 260,
};
/** Até este tamanho as pausas são integrais; acima, encolhem proporcionalmente. */
const PAUSA_REF = 600;

/**
 * Revela `texto` progressivamente e devolve quantos caracteres mostrar.
 * - `ativo`: liga a escrita (desligada → mostra tudo).
 * - `completo`: o texto já chegou inteiro (false durante streaming: a escrita
 *   alcança o que chegou e espera o resto).
 * - `chave`: mude para reiniciar do zero (nova geração).
 */
export function useEscritaFluida(
  texto: string,
  {
    ativo,
    completo = true,
    chave = 0,
  }: { ativo: boolean; completo?: boolean; chave?: number },
) {
  const [n, setN] = useState(0);
  const [terminou, setTerminou] = useState(false);
  const [chaveAtual, setChaveAtual] = useState(chave);
  if (chave !== chaveAtual) {
    setChaveAtual(chave);
    setN(0);
    setTerminou(false);
  }

  const nRef = useRef(0);
  const alvo = useRef({ texto, completo });
  useEffect(() => {
    alvo.current = { texto, completo };
  }, [texto, completo]);
  useEffect(() => {
    nRef.current = 0;
  }, [chave]);

  const animando = ativo && !terminou;

  useEffect(() => {
    if (!animando) return;
    let raf = 0;
    let ultimo = performance.now();
    let credito = 0; // caracteres "a pagar" acumulados pelo tempo
    let esperaAte = 0; // pausa de pontuação em andamento

    const tick = (agora: number) => {
      const { texto, completo } = alvo.current;
      const total = texto.length;
      const dt = Math.min(agora - ultimo, 100);
      ultimo = agora;
      let atual = nRef.current;

      if (atual >= total) {
        if (completo) {
          setTerminou(true);
          return;
        }
      } else if (agora >= esperaAte) {
        const cps = completo
          ? Math.max(CPS, total / DURACAO_MAX)
          : Math.max(CPS, (total - atual) / ALCANCE_STREAM);
        credito += (dt * cps) / 1000;

        // Revela palavra a palavra (a palavra + o espaço/quebra seguinte).
        while (atual < total) {
          let fim = atual;
          while (fim < total && !/\s/.test(texto[fim])) fim++;
          if (fim < total) fim++;
          if (credito < fim - atual) break;
          credito -= fim - atual;
          atual = fim;
          const sep = texto[fim - 1];
          const marca = sep === "\n" ? "\n" : /\s/.test(sep) ? texto[fim - 2] : sep;
          // Textos longos encurtam as pausas, para a escrita não se arrastar.
          const pausa = (PAUSA[marca] ?? 0) * Math.min(1, PAUSA_REF / total);
          if (pausa) {
            esperaAte = agora + pausa;
            credito = 0;
            break;
          }
        }
        if (atual !== nRef.current) {
          nRef.current = atual;
          setN(atual);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animando]);

  const visivel = animando ? Math.min(n, texto.length) : texto.length;
  return { visivel, escrevendo: animando };
}

/** Cursor piscante no fim do texto que está sendo escrito. */
export function CursorIA() {
  return (
    <span
      aria-hidden="true"
      className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[3px] animate-pulse bg-primary"
    />
  );
}

/** Círculo vermelho girando (carregando). */
export function SpinnerIA({ className = "size-9" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`motion-essencial inline-block shrink-0 animate-spin rounded-full border-4 border-brand-soft border-t-primary ${className}`}
    />
  );
}

/** Indicador de "a IA está trabalhando" (área em branco + círculo vermelho girando). */
export function PensandoIA({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground"
    >
      <SpinnerIA />
      <span className="flex items-center gap-1.5">
        <Sparkles className="size-4 shrink-0 text-primary-hover" aria-hidden="true" />
        {children}
      </span>
    </div>
  );
}

/** Selo que identifica conteúdo gerado por IA. */
export function SeloIA({ children = "Gerado por IA" }: { children?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-primary-active">
      <Sparkles className="size-3" aria-hidden="true" />
      {children}
    </span>
  );
}
