"use client";

import { useActionState } from "react";
import { definirSenha, type SenhaState } from "@/lib/actions/senha";
import { Button } from "@/components/ui/button";

const campo =
  "h-10 w-full rounded-md border border-input bg-card px-3 text-[15px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25";

export function FormularioSenha() {
  const [estado, acao, pendente] = useActionState<SenhaState, FormData>(
    definirSenha,
    {},
  );

  return (
    <form action={acao} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="senha" className="text-sm font-semibold">
          Nova senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={campo}
        />
        <p className="text-xs text-muted-foreground">Pelo menos 8 caracteres.</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirmacao" className="text-sm font-semibold">
          Repita a nova senha
        </label>
        <input
          id="confirmacao"
          name="confirmacao"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={campo}
        />
      </div>

      {estado.error && (
        <p role="alert" className="text-sm text-destructive">
          {estado.error}
        </p>
      )}

      <Button type="submit" size="lg" className="h-10 w-full" disabled={pendente}>
        {pendente ? "Salvando..." : "Salvar senha e entrar"}
      </Button>
    </form>
  );
}
