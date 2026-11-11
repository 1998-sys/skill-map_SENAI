"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUS_OPCOES = [
  { value: "", label: "Todos" },
  { value: "RASCUNHO", label: "Rascunho" },
  { value: "ENVIADO", label: "Enviado" },
] as const;

const campoData =
  "h-10 rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25";

export function Filtros({
  status,
  q,
  de,
  ate,
}: {
  status: string;
  q: string;
  de: string;
  ate: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [busca, setBusca] = useState(q);

  function aplicar(next: { status?: string; q?: string; de?: string; ate?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [chave, valor] of Object.entries(next)) {
      if (valor) params.set(chave, valor);
      else params.delete(chave);
    }
    startTransition(() => {
      router.replace(`?${params.toString()}`, { scroll: false });
    });
  }

  const temFiltro = Boolean(status || q || de || ate);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex flex-col gap-1.5 sm:w-48">
        <label htmlFor="status" className="text-sm text-muted-foreground">
          Status
        </label>
        <select
          id="status"
          value={status}
          disabled={pending}
          onChange={(e) => aplicar({ status: e.target.value })}
          className="h-10 rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25"
        >
          {STATUS_OPCOES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Período: dia da aula, de/até (um dos dois basta). */}
      <div className="flex gap-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="de" className="text-sm text-muted-foreground">
            De
          </label>
          <input
            id="de"
            type="date"
            value={de}
            max={ate || undefined}
            disabled={pending}
            onChange={(e) => aplicar({ de: e.target.value })}
            className={campoData}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ate" className="text-sm text-muted-foreground">
            Até
          </label>
          <input
            id="ate"
            type="date"
            value={ate}
            min={de || undefined}
            disabled={pending}
            onChange={(e) => aplicar({ ate: e.target.value })}
            className={campoData}
          />
        </div>
      </div>

      <form
        className="flex flex-1 items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          aplicar({ q: busca.trim() });
        }}
      >
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="q" className="text-sm text-muted-foreground">
            Busca
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="q"
              placeholder="Buscar por aula, tema ou palavra-chave..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="h-10 pl-9"
            />
          </div>
        </div>
        <Button
          type="submit"
          variant="outline-primary"
          className="h-10 px-4"
          disabled={pending}
        >
          Buscar
        </Button>
      </form>

      {temFiltro && (
        <Button
          type="button"
          variant="ghost"
          className="h-10"
          disabled={pending}
          onClick={() => {
            setBusca("");
            aplicar({ status: "", q: "", de: "", ate: "" });
          }}
        >
          Limpar
        </Button>
      )}
    </div>
  );
}
