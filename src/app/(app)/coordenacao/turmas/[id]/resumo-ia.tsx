"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import {
  gerarResumoTurma,
  type ConteudoConsolidado,
} from "@/lib/actions/coordenacao";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";

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
    <SectionCard
      title="Resumo da turma com IA"
      description="Gera um resumo executivo a partir das observações consolidadas dos registros enviados. Não atribui nota nem faz ranking."
      action={
        <Button size="lg" className="px-4" disabled={pending} onClick={gerar}>
          <FileText />
          {pending
            ? "Gerando..."
            : resumo
              ? "Gerar novamente"
              : "Gerar resumo da turma"}
        </Button>
      }
    >
      {resumo ? (
        <p className="rounded-lg border bg-muted/50 p-4 text-[15px] leading-relaxed whitespace-pre-wrap">
          {resumo}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nenhum resumo gerado nesta visita.
        </p>
      )}
    </SectionCard>
  );
}
