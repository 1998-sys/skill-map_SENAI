// Tela de carregamento: "esqueleto" no formato das páginas (cartões cinza
// pulsando) enquanto o servidor busca os dados. Usada pelos arquivos
// loading.tsx — o Next mostra sozinho durante a navegação.

function Barra({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />;
}

function CartaoEsqueleto({ linhas }: { linhas: number }) {
  return (
    <div className="rounded-xl border bg-card p-4 sm:p-6">
      <Barra className="h-6 w-48" />
      <div className="mt-2 h-1 w-10 rounded bg-primary/30" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: linhas }, (_, i) => (
          <Barra key={i} className={`h-4 ${i % 3 === 2 ? "w-2/3" : "w-full"}`} />
        ))}
      </div>
    </div>
  );
}

export function Carregando({ telaInteira = false }: { telaInteira?: boolean }) {
  return (
    <main
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6 ${telaInteira ? "min-h-screen pt-10" : ""}`}
    >
      <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span
          className="inline-block size-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
          aria-hidden="true"
        />
        Carregando…
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-4">
            <Barra className="h-3 w-24" />
            <Barra className="mt-3 h-7 w-16" />
          </div>
        ))}
      </div>
      <CartaoEsqueleto linhas={4} />
      <CartaoEsqueleto linhas={6} />
    </main>
  );
}
