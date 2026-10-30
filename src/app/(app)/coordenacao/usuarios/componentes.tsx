"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, KeyRound, UserCheck, UserPlus, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BotaoConfirmar } from "@/components/botao-confirmar";
import {
  criarUsuario,
  desativarUsuario,
  gerarSenhaTemporaria,
  reativarUsuario,
  type UsuarioState,
} from "@/lib/actions/usuarios";
import type { SituacaoUsuario } from "@/lib/db/usuarios";

const campo =
  "h-10 w-full rounded-md border border-input bg-card px-3 text-[15px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25";

// ─── Senha temporária gerada (mostrada uma única vez) ───────────────────────

function SenhaGerada({
  nome,
  email,
  senha,
}: {
  nome?: string;
  email?: string;
  senha: string;
}) {
  const texto =
    `Olá${nome ? `, ${nome}` : ""}! Seu acesso ao SkillMap:\n` +
    `${window.location.origin}\n` +
    `E-mail: ${email}\n` +
    `Senha temporária: ${senha}\n` +
    `No primeiro acesso, o sistema vai pedir para você criar uma senha nova.`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success("Texto copiado. Agora é só enviar ao professor.");
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto e copie à mão.");
    }
  }

  return (
    <div
      role="status"
      className="space-y-3 rounded-lg border border-success/30 bg-success-soft p-4 text-sm"
    >
      <p className="font-semibold text-success">
        Senha temporária gerada. Ela aparece só agora: copie e repasse ao usuário.
      </p>
      <dl className="grid gap-1 sm:grid-cols-[auto_1fr] sm:gap-x-3">
        <dt className="text-muted-foreground">E-mail</dt>
        <dd className="font-medium break-all">{email}</dd>
        <dt className="text-muted-foreground">Senha temporária</dt>
        <dd className="font-mono text-base font-semibold tracking-wide">{senha}</dd>
      </dl>
      <Button type="button" variant="outline-primary" onClick={copiar}>
        <Copy /> Copiar texto para enviar
      </Button>
    </div>
  );
}

// ─── Formulário "Novo usuário" ──────────────────────────────────────────────

export function NovoUsuario() {
  const [estado, acao, pendente] = useActionState<UsuarioState, FormData>(
    criarUsuario,
    {},
  );

  return (
    <div className="space-y-4">
      {/* key: limpa o formulário depois de criar */}
      <form
        key={estado.senha ?? estado.error ?? "novo"}
        action={acao} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="nome" className="text-sm font-semibold">
            Nome
          </label>
          <input
            id="nome"
            name="nome"
            required
            className={campo}
            autoComplete="off"
            defaultValue={estado.valores?.nome}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-semibold">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className={campo}
            autoComplete="off"
            placeholder="nome@sp.senai.br"
            defaultValue={estado.valores?.email}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="role" className="text-sm font-semibold">
            Papel
          </label>
          <select
            id="role"
            name="role"
            defaultValue={estado.valores?.role ?? "PROFESSOR"}
            className={campo}
          >
            <option value="PROFESSOR">Professor</option>
            <option value="COORDENACAO">Coordenação</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button type="submit" size="lg" className="h-10 w-full" disabled={pendente}>
            <UserPlus /> {pendente ? "Criando..." : "Criar usuário"}
          </Button>
        </div>
      </form>

      {estado.error && (
        <p role="alert" className="text-sm text-destructive">
          {estado.error}
        </p>
      )}
      {estado.ok && estado.senha && (
        <SenhaGerada nome={estado.nome} email={estado.email} senha={estado.senha} />
      )}
    </div>
  );
}

// ─── Ações de cada usuário ──────────────────────────────────────────────────

export function AcoesUsuario({
  id,
  nome,
  situacao,
}: {
  id: string;
  nome: string;
  situacao: SituacaoUsuario;
}) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [confirmandoSenha, setConfirmandoSenha] = useState(false);
  const [gerada, setGerada] = useState<UsuarioState | null>(null);

  function gerarSenha() {
    startTransition(async () => {
      const r = await gerarSenhaTemporaria(id);
      if (r.error) {
        toast.error(r.error);
        return;
      }
      setConfirmandoSenha(false);
      setGerada(r);
      router.refresh();
    });
  }

  if (situacao === "DESATIVADO") {
    return (
      <BotaoConfirmar
        tipo="restaurar"
        icone={UserCheck}
        acao={reativarUsuario.bind(null, id)}
        rotulo="Reativar acesso"
        aviso={`${nome} volta a conseguir entrar no SkillMap com a senha que tinha.`}
        sucesso="Acesso reativado."
      />
    );
  }

  return (
    <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:items-end">
      <div className="flex flex-wrap gap-2">
        {!confirmandoSenha && (
          <Button type="button" variant="outline-primary" onClick={() => setConfirmandoSenha(true)}>
            <KeyRound /> Gerar senha temporária
          </Button>
        )}
        <BotaoConfirmar
          icone={UserX}
          acao={desativarUsuario.bind(null, id)}
          rotulo="Desativar acesso"
          aviso={`${nome} não vai mais conseguir entrar. As turmas e os registros continuam no sistema, e o acesso pode ser reativado.`}
          sucesso="Acesso desativado."
        />
      </div>

      {confirmandoSenha && (
        <div
          role="alertdialog"
          aria-label="Gerar senha temporária"
          className="flex max-w-md flex-col gap-2 rounded-lg border bg-muted p-3 text-sm"
        >
          <p>
            A senha atual de {nome} deixa de valer. No próximo acesso, será preciso criar
            uma senha nova.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={gerarSenha} disabled={pendente} autoFocus>
              <KeyRound /> {pendente ? "Gerando..." : "Confirmar: gerar senha"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmandoSenha(false)}
              disabled={pendente}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {gerada?.senha && (
        <SenhaGerada nome={nome} email={gerada.email} senha={gerada.senha} />
      )}
    </div>
  );
}
