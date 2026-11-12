"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { editarUsuario } from "@/lib/actions/usuarios";
import type { Role } from "@/lib/types";

const campo =
  "h-10 w-full rounded-md border border-input bg-card px-3 text-[15px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25";

// Coordenação corrige o nome e troca o papel de um usuário. No próprio
// usuário só o nome muda (ninguém troca o próprio papel).
export function EditarUsuario({
  id,
  nome,
  role,
  souEu,
}: {
  id: string;
  nome: string;
  role: Role;
  souEu: boolean;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [pendente, startTransition] = useTransition();
  const [novoNome, setNovoNome] = useState(nome);
  const [novoPapel, setNovoPapel] = useState<Role>(role);

  if (!aberto) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          setNovoNome(nome);
          setNovoPapel(role);
          setAberto(true);
        }}
      >
        <Pencil /> Editar
      </Button>
    );
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await editarUsuario(id, { nome: novoNome, role: novoPapel });
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success("Usuário atualizado.");
      setAberto(false);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={salvar}
      className="mt-2 flex w-full flex-col gap-2 rounded-lg border bg-muted p-3 sm:flex-row sm:items-end"
    >
      <div className="flex-1 space-y-1">
        <label htmlFor={`nome-${id}`} className="text-xs text-muted-foreground">Nome</label>
        <input
          id={`nome-${id}`}
          className={campo}
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          required
          minLength={2}
        />
      </div>
      <div className="space-y-1 sm:w-44">
        <label htmlFor={`papel-${id}`} className="text-xs text-muted-foreground">Papel</label>
        <select
          id={`papel-${id}`}
          className={campo}
          value={novoPapel}
          disabled={souEu}
          title={souEu ? "Você não pode trocar o seu próprio papel" : undefined}
          onChange={(e) => setNovoPapel(e.target.value as Role)}
        >
          <option value="PROFESSOR">Professor</option>
          <option value="COORDENACAO">Coordenação</option>
        </select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="h-10" disabled={pendente}>
          <Save /> {pendente ? "Salvando..." : "Salvar"}
        </Button>
        <Button type="button" variant="ghost" className="h-10" disabled={pendente} onClick={() => setAberto(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
