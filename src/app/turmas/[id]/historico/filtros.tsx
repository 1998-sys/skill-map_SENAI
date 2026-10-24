"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUS_OPCOES = [
  { value: "", label: "Todos" },
  { value: "RASCUNHO", label: "Rascunho" },
  { value: "ENVIADO", label: "Enviado" },
] as const;

export function Filtros({ status, q }: { status: string; q: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [busca, setBusca] = useState(q);

  function aplicar(next: { status?: string; q?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [chave, valor] of Object.entries(next)) {
      if (valor) params.set(chave, valor);
      else params.delete(chave);
    }
    startTransition(() => {
      router.replace(`?${params.toString()}`, { scroll: false });
    });
  }

  const temFiltro = Boolean(status || q);

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="status" className="text-xs text-muted-foreground">
          Status
        </label>
        <select
          id="status"
          value={status}
          disabled={pending}
          onChange={(e) => aplicar({ status: e.target.value })}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {STATUS_OPCOES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <form
        className="flex flex-1 items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          aplicar({ q: busca.trim() });
        }}
      >
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="q" className="text-xs text-muted-foreground">
            Busca
          </label>
          <Input
            id="q"
            placeholder="Tema, relato, capacidades, análise..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <Button type="submit" variant="outline" disabled={pending}>
          Buscar
        </Button>
      </form>

      {temFiltro && (
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() => {
            setBusca("");
            aplicar({ status: "", q: "" });
          }}
        >
          Limpar
        </Button>
      )}
    </div>
  );
}
