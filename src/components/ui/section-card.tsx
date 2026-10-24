import type { ReactNode } from "react";

// Cartão de seção padrão SENAI (branco, borda, título 800 com sublinhado
// vermelho, descrição opcional + ação à direita).

/** Sublinhado vermelho curto sob títulos de seção (padrão SENAI). */
export function TitleAccent({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`mt-2 h-[3px] w-11 bg-primary ${className}`} />
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border bg-card p-4 sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <>
                <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                  {title}
                </h2>
                <TitleAccent />
              </>
            )}
            {description && (
              <p className="mt-2.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
