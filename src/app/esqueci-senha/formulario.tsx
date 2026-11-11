"use client";

import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { solicitarReset, type ResetState } from "@/lib/actions/senha";
import { Button } from "@/components/ui/button";

const campo =
  "h-10 w-full rounded-md border border-input bg-card px-3 text-[15px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25";

export function FormularioReset() {
  const [estado, acao, pendente] = useActionState<ResetState, FormData>(solicitarReset, {});

  // Depois de enviar: a mesma mensagem para qualquer e-mail (não revela quem tem conta).
  if (estado.ok) {
    return (
      <div role="status" className="space-y-2 rounded-lg bg-success-soft p-4 text-sm">
        <p className="flex items-center gap-2 font-semibold text-success">
          <MailCheck className="size-4" /> Pedido enviado
        </p>
        <p>
          Se o e-mail estiver cadastrado, você receberá um link para criar uma senha nova.
          Confira também a pasta <strong>Lixo Eletrônico</strong>.
        </p>
      </div>
    );
  }

  return (
    <form action={acao} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-semibold">
          E-mail de acesso
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={campo}
        />
      </div>

      {estado.error && (
        <p role="alert" className="text-sm text-destructive">
          {estado.error}
        </p>
      )}

      <Button type="submit" size="lg" className="h-10 w-full" disabled={pendente}>
        {pendente ? "Enviando..." : "Enviar link para criar senha nova"}
      </Button>
    </form>
  );
}
