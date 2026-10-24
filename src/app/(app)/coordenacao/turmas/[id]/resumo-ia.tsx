"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  gerarResumoTurma,
  type ConteudoConsolidado,
} from "@/lib/actions/coordenacao";
import { Button } from "@/components/ui/button";

export function ResumoIA({ conteudo }: { conteudo: ConteudoConsolidado }) {
  const [pending, startTransition] = useTransition();
  const [resumo, setResumo] = useState<string | null>(null);

  function gerar() {
    startTransition(async () => {
      const res = await gerarResumoTurma(conteudo);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setResumo(res.resumo ?? "");
      toast.success("Resumo gerado.");
    });
  }

  return (
    <section className="mt-8 rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">Resumo da turma com IA</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gera um resumo executivo a partir das observações consolidadas dos
            registros enviados. Não atribui nota nem faz ranking.
          </p>
        </div>
        <Button disabled={pending} onClick={gerar}>
          {pending
            ? "Gerando..."
            : resumo
              ? "Gerar novamente"
              : "Gerar resumo da turma com IA"}
        </Button>
      </div>

      {resumo && (
        <p className="mt-4 whitespace-pre-wrap border-t pt-4 text-sm leading-relaxed">
          {resumo}
        </p>
      )}
    </section>
  );
}
