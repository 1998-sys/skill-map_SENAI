"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">
          Capacidades{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({capacidades.length})
          </span>
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMostrarBloco((v) => !v)}
        >
          {mostrarBloco ? "Fechar colar em bloco" : "Colar em bloco"}
        </Button>
      </div>

      {mostrarBloco && (
        <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
          <Textarea
            rows={6}
            placeholder={"Cole várias capacidades (uma por linha)."}
            value={bloco}
            onChange={(e) => setBloco(e.target.value)}
          />
          <Button
            size="sm"
            disabled={pending || bloco.trim().length === 0}
            onClick={() =>
              run(async () => {
                await addCapacidadesEmBloco(turmaId, bloco);
                setBloco("");
                setMostrarBloco(false);
              }, "Capacidades adicionadas.")
            }
          >
            Adicionar lista
          </Button>
        </div>
      )}

      {capacidades.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma capacidade cadastrada ainda.
        </p>
      ) : (
        <ol className="space-y-2">
          {capacidades.map((cap, i) => (
            <li
              key={cap.id}
              className="flex items-start gap-3 rounded-lg border p-3"
            >
              <span className="mt-1 text-xs text-muted-foreground tabular-nums">
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
                  <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <p className="text-sm">{cap.texto}</p>
                    <div className="flex shrink-0 gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditId(cap.id);
                        setEditTexto(cap.texto);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() =>
                        run(
                          () => deleteCapacidade(cap.id, turmaId),
                          "Capacidade removida.",
                        )
                      }
                    >
                      Remover
                    </Button>
                    </div>
                  </div>
                </>
              )}
            </li>
          ))}
        </ol>
      )}

      <div className="flex gap-2 pt-2">
        <Input
          placeholder="Adicionar uma capacidade..."
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
          disabled={pending || nova.trim().length === 0}
          onClick={() =>
            run(async () => {
              await addCapacidade(turmaId, nova);
              setNova("");
            }, "Capacidade adicionada.")
          }
        >
          Adicionar
        </Button>
      </div>
    </div>
  );
}
