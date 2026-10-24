"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Sparkles } from "lucide-react";

// Escrita fluida para textos gerados por IA: o texto aparece aos poucos, como
// nos assistentes de IA, deixando claro que é uma resposta gerada. Respeita
// "reduzir movimento" do sistema (mostra tudo de uma vez).

const QUERY = "(prefers-reduced-motion: reduce)";

function useReduzirMovimento() {
  return useSyncExternalStore(
    (avisar) => {
      const m = window.matchMedia(QUERY);
      m.addEventListener("change", avisar);
      return () => m.removeEventListener("change", avisar);
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

/**
 * Revela `total` caracteres progressivamente.
 * - `ativo`: liga a animação (desligada → mostra tudo).
 * - `completo`: o texto já chegou inteiro (false durante streaming: o cursor
 *   alcança o que chegou e espera o resto).
 * - `chave`: mude para reiniciar do zero (nova geração).
 */
export function useEscritaFluida(
  total: number,
  {
    ativo,
    completo = true,
    chave = 0,
    velocidade = 3,
  }: { ativo: boolean; completo?: boolean; chave?: number; velocidade?: number },
) {
  const reduzir = useReduzirMovimento();
  const [n, setN] = useState(0);
  const [terminou, setTerminou] = useState(false);
  const [chaveAtual, setChaveAtual] = useState(chave);
  if (chave !== chaveAtual) {
    setChaveAtual(chave);
    setN(0);
    setTerminou(false);
  }

  const nRef = useRef(0);
  const alvo = useRef({ total, completo });
  useEffect(() => {
    alvo.current = { total, completo };
  }, [total, completo]);
  useEffect(() => {
    nRef.current = 0;
  }, [chave]);

  const animando = ativo && !reduzir && !terminou;

  useEffect(() => {
    if (!animando) return;
    let raf = 0;
    const tick = () => {
      const { total, completo } = alvo.current;
      const atual = nRef.current;
      if (atual >= total) {
        if (completo) {
          setTerminou(true);
          return;
        }
      } else {
        // Passo mínimo constante; acelera quando há muito texto acumulado.
        const prox = Math.min(total, atual + Math.max(velocidade, Math.ceil((total - atual) / 24)));
        nRef.current = prox;
        setN(prox);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animando, velocidade]);

  const visivel = animando ? Math.min(n, total) : total;
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

/** Indicador de "a IA está trabalhando" (antes do primeiro texto chegar). */
export function PensandoIA({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-lg border border-dashed bg-brand-soft/50 px-4 py-3 text-sm text-foreground"
    >
      <Sparkles className="size-4 shrink-0 animate-pulse text-primary-hover" aria-hidden="true" />
      <span>{children}</span>
      <span aria-hidden="true" className="flex gap-1">
        <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-primary" />
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
