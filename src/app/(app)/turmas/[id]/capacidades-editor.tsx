"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ClipboardPaste, Pencil, Plus, Save, Trash2 } from "lucide-react";
import {
  addCapacidade,
  addCapacidadesEmBloco,
  updateCapacidade,
  deleteCapacidade,
} from "@/lib/actions/turmas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Cap = { id: string; texto: string };

export function CapacidadesEditor({
  turmaId,
  capacidades,
}: {
  turmaId: string;
  capacidades: Cap[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [nova, setNova] = useState("");
  const [bloco, setBloco] = useState("");
  const [mostrarBloco, setMostrarBloco] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTexto, setEditTexto] = useState("");

  function run(fn: () => Promise<void>, okMsg: string) {
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
        toast.success(okMsg);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Ocorreu um erro.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Capacidades do Curso{" "}
            <span className="text-base font-normal text-muted-foreground">
              ({capacidades.length})
            </span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Capacidades previstas no Plano de Curso. Cole a lista em bloco ou
            adicione uma a uma.
          </p>
        </div>
        <Button
          variant="outline-primary"
          size="lg"
          onClick={() => setMostrarBloco((v) => !v)}
        >
          <ClipboardPaste />
          {mostrarBloco ? "Fechar colar em bloco" : "Colar em bloco"}
        </Button>
      </div>

      {mostrarBloco && (
        <div className="space-y-3 rounded-lg border bg-muted/50 p-3">
          <Textarea
            rows={7}
            placeholder={
              "Cole várias capacidades (uma por linha).\n1. Interpretar diagramas elétricos\n2. Identificar componentes"
            }
            value={bloco}
            onChange={(e) => setBloco(e.target.value)}
            className="bg-card"
          />
          <Button
            size="lg"
            disabled={pending || bloco.trim().length === 0}
            onClick={() =>
              run(async () => {
                await addCapacidadesEmBloco(turmaId, bloco);
                setBloco("");
                setMostrarBloco(false);
              }, "Capacidades adicionadas.")
            }
          >
            <Save /> Salvar lista
          </Button>
        </div>
      )}

      {capacidades.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma capacidade cadastrada ainda.
        </p>
      ) : (
        <ol className="divide-y rounded-lg border">
          {capacidades.map((cap, i) => (
            <li
              key={cap.id}
              className="flex items-start gap-3 px-3 py-2.5 sm:px-4"
            >
              <span className="mt-0.5 w-6 shrink-0 text-right text-[15px] text-muted-foreground tabular-nums">
                {i + 1}.
              </span>
              {editId === cap.id ? (
                <div className="flex-1 space-y-2">
                  <Textarea
                    rows={2}
                    value={editTexto}
                    onChange={(e) => setEditTexto(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        run(async () => {
                          await updateCapacidade(cap.id, turmaId, editTexto);
                          setEditId(null);
                        }, "Capacidade atualizada.")
                      }
                    >
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditId(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-1 items-start justify-between gap-2">
                    <p className="pt-0.5 text-[15px]">{cap.texto}</p>
                    <div className="flex shrink-0 gap-0.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Editar capacidade"
                        title="Editar"
                        onClick={() => {
                          setEditId(cap.id);
                          setEditTexto(cap.texto);
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Remover capacidade"
                        title="Remover"
                        className="hover:text-destructive"
                        disabled={pending}
                        onClick={() =>
                          run(
                            () => deleteCapacidade(cap.id, turmaId),
                            "Capacidade removida.",
                          )
                        }
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </li>
          ))}
        </ol>
      )}

      <div className="flex flex-col gap-2 pt-1 sm:flex-row">
        <Input
          className="h-9"
          placeholder="Nova capacidade (ex.: Diagnosticar falhas)"
          value={nova}
          onChange={(e) => setNova(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && nova.trim()) {
              e.preventDefault();
              run(async () => {
                await addCapacidade(turmaId, nova);
                setNova("");
              }, "Capacidade adicionada.");
            }
          }}
        />
        <Button
          variant="outline-primary"
          size="lg"
          disabled={pending || nova.trim().length === 0}
          onClick={() =>
            run(async () => {
              await addCapacidade(turmaId, nova);
              setNova("");
            }, "Capacidade adicionada.")
          }
        >
          <Plus /> Adicionar capacidade
        </Button>
      </div>
    </div>
  );
}
