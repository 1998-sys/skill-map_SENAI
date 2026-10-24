import type { ReactNode } from "react";

// Peças de apresentação da análise pedagógica (seções numeradas + listas),
// usadas pelo painel do professor e pela visão de leitura da Coordenação.

export function Secao({
  n,
  titulo,
  children,
}: {
  n: number;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3 py-4 first:pt-0 sm:gap-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-base font-extrabold text-primary-hover">
        {n}
      </span>
      <div className="min-w-0 flex-1 space-y-2.5 pt-1">
        <h3 className="text-lg font-extrabold tracking-tight">{titulo}</h3>
        {children}
      </div>
    </div>
  );
}

export function Bullets({
  itens,
  numerada = false,
  vazio = "Nenhum item.",
  fim,
}: {
  itens: string[];
  numerada?: boolean;
  /** Texto quando não há itens; `null` não mostra nada (ex.: IA ainda escrevendo). */
  vazio?: string | null;
  /** Conteúdo após o último item (ex.: cursor da escrita da IA). */
  fim?: ReactNode;
}) {
  if (itens.length === 0) {
    return vazio ? <p className="text-sm text-muted-foreground">{vazio}</p> : null;
  }
  return (
    <ul className="space-y-1.5 text-[15px]">
      {itens.map((t, i) => (
        <li key={i} className="flex gap-3">
          {numerada ? (
            <span className="w-5 shrink-0 text-right tabular-nums">{i + 1}.</span>
          ) : (
            <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-primary" />
          )}
          <span>
            {t}
            {i === itens.length - 1 && fim}
          </span>
        </li>
      ))}
    </ul>
  );
}
