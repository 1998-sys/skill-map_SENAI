"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Square } from "lucide-react";
import type { ConteudoConsolidado } from "@/lib/ia/resumo";
import type { ResumoSalvo } from "@/lib/db/consultas";
import { formatarDataHora } from "@/lib/datas";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { CursorIA, PensandoIA, SeloIA, useEscritaFluida } from "@/components/ia-escrita";

type Fase = "parado" | "pensando" | "escrevendo" | "pronto";

// Resumo da turma com IA, transmitido em streaming e escrito de forma fluida.
// O servidor salva o resumo quando a IA termina; ao abrir a tela, aparece o
// último resumo salvo (com data, autor e quantos registros considerou).
export function ResumoIA({
  turmaId,
  conteudo,
  salvo,
}: {
  turmaId: string;
  conteudo: ConteudoConsolidado;
  salvo: ResumoSalvo | null;
}) {
  const router = useRouter();
  const [fase, setFase] = useState<Fase>("parado");
  const [texto, setTexto] = useState("");
  const [geracao, setGeracao] = useState(0);
  const abortar = useRef<AbortController | null>(null);

  useEffect(() => () => abortar.current?.abort(), []);

  const { visivel, escrevendo } = useEscritaFluida(texto, {
    ativo: fase === "escrevendo" || fase === "pronto",
    completo: fase === "pronto",
    chave: geracao,
  });

  async function gerar() {
    abortar.current?.abort();
    const controle = new AbortController();
    abortar.current = controle;
    setTexto("");
    setGeracao((g) => g + 1);
    setFase("pensando");

    try {
      const res = await fetch("/api/coordenacao/resumo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...conteudo, turmaId }),
        signal: controle.signal,
      });
      const tipo = res.headers.get("content-type") ?? "";
      // Sessão expirada: o middleware redireciona para o login (HTML).
      if (res.redirected || !tipo.startsWith("text/plain")) {
        throw new Error("Sessão expirada. Entre novamente.");
      }
      if (!res.ok || !res.body) {
        throw new Error((await res.text()) || "Falha ao gerar o resumo.");
      }

      const leitor = res.body.getReader();
      const decoder = new TextDecoder();
      let recebido = "";
      for (;;) {
        const { done, value } = await leitor.read();
        if (done) break;
        const pedaco = decoder.decode(value, { stream: true });
        if (!pedaco) continue;
        recebido += pedaco;
        setTexto(recebido);
        setFase("escrevendo");
      }
      if (!recebido.trim()) throw new Error("Resposta vazia da IA.");
      setFase("pronto");
      router.refresh(); // atualiza "último resumo salvo" e a página de impressão
    } catch (e) {
      if (controle.signal.aborted) return;
      setFase((f) => (f === "escrevendo" ? "pronto" : "parado"));
      toast.error(e instanceof Error ? e.message : "Falha ao gerar o resumo.");
    }
  }

  function parar() {
    abortar.current?.abort();
    setFase(texto ? "pronto" : "parado");
  }

  const ocupado = fase === "pensando" || fase === "escrevendo";
  const digitando = escrevendo && (fase === "escrevendo" || visivel < texto.length);

  return (
    <SectionCard
      title="Resumo da turma com IA"
      description="Gera um resumo executivo a partir das observações consolidadas dos registros enviados. Não atribui nota nem faz ranking."
      action={
        ocupado ? (
          <Button size="lg" variant="outline-primary" className="px-4" onClick={parar}>
            <Square /> Parar
          </Button>
        ) : digitando ? null : ( // a IA já terminou, mas o texto ainda está sendo escrito
          <Button size="lg" className="px-4" onClick={gerar}>
            <FileText />
            {texto || salvo ? "Gerar novo resumo" : "Gerar resumo da turma"}
          </Button>
        )
      }
    >
      {fase === "pensando" ? (
        <PensandoIA>A IA está lendo os registros enviados e escrevendo o resumo</PensandoIA>
      ) : texto ? (
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <SeloIA />
            <span className="text-xs text-muted-foreground">
              {digitando ? "Escrevendo…" : "Revise antes de usar — a decisão é da Coordenação."}
            </span>
          </div>
          <p
            aria-live="polite"
            aria-busy={digitando}
            className="text-[15px] leading-relaxed whitespace-pre-wrap"
          >
            {texto.slice(0, visivel)}
            {digitando && <CursorIA />}
          </p>
        </div>
      ) : salvo ? (
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <SeloIA />
            <span className="text-xs text-muted-foreground">
              Último resumo salvo · {formatarDataHora(salvo.criadoEm)}
              {salvo.autorNome && ` · por ${salvo.autorNome}`} · considerou{" "}
              {salvo.totalRegistros} {salvo.totalRegistros === 1 ? "registro" : "registros"}
            </span>
          </div>
          {conteudo.totalEnviados > salvo.totalRegistros && (
            <p className="mb-3 rounded-md bg-warning-soft px-3 py-2 text-xs font-medium text-warning">
              Chegaram registros novos depois deste resumo ({conteudo.totalEnviados} enviados
              agora). Gere um novo resumo para incluí-los.
            </p>
          )}
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{salvo.texto}</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nenhum resumo gerado ainda. O resumo fica salvo para consultar e imprimir depois.
        </p>
      )}
    </SectionCard>
  );
}
