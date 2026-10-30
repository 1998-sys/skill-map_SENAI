import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { listarUsuarios, type SituacaoUsuario } from "@/lib/db/usuarios";
import { formatarDataHora } from "@/lib/datas";
import { buttonVariants } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { PageNote } from "@/components/ui/info-field";
import { AcoesUsuario, NovoUsuario } from "./componentes";

export const metadata = { title: "Usuários · SkillMap" };

const SITUACAO: Record<SituacaoUsuario, { rotulo: string; classe: string }> = {
  ATIVO: { rotulo: "Ativo", classe: "bg-success-soft text-success" },
  TROCAR_SENHA: {
    rotulo: "Aguardando troca de senha",
    classe: "bg-warning-soft text-warning",
  },
  DESATIVADO: { rotulo: "Desativado", classe: "bg-muted text-muted-foreground" },
};

// Gestão de acessos: só a Coordenação cria usuários, gera senha temporária e
// desativa/reativa. (As ações conferem o papel de novo no servidor.)
export default async function UsuariosPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "COORDENACAO") redirect("/dashboard");

  const usuarios = await listarUsuarios();

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      <SectionCard
        title="Novo usuário"
        description="O sistema gera uma senha temporária para você repassar. No primeiro acesso, o usuário cria uma senha própria."
      >
        <NovoUsuario />
      </SectionCard>

      <SectionCard
        title="Usuários"
        description={`${usuarios.length} ${usuarios.length === 1 ? "usuário" : "usuários"} com acesso ao SkillMap.`}
      >
        <ul className="divide-y rounded-lg border">
          {usuarios.map((u) => {
            const situacao = SITUACAO[u.situacao];
            const souEu = u.id === profile.id;
            return (
              <li
                key={u.id}
                className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{u.nome}</p>
                    {souEu && <span className="text-xs text-muted-foreground">(você)</span>}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${situacao.classe}`}
                    >
                      {situacao.rotulo}
                    </span>
                  </div>
                  <p className="text-sm break-all text-muted-foreground">{u.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {u.role === "COORDENACAO" ? "Coordenação" : "Professor"} · Último acesso:{" "}
                    {u.ultimoAcesso ? formatarDataHora(u.ultimoAcesso) : "nunca entrou"}
                  </p>
                </div>
                {souEu ? (
                  <Link
                    href="/definir-senha"
                    className={buttonVariants({ variant: "outline-primary" })}
                  >
                    <KeyRound /> Trocar minha senha
                  </Link>
                ) : (
                  <AcoesUsuario id={u.id} nome={u.nome} situacao={u.situacao} />
                )}
              </li>
            );
          })}
        </ul>
      </SectionCard>

      <PageNote>
        Desativar não apaga ninguém: o nome continua nas turmas e registros. Se um
        professor esquecer a senha, gere uma senha temporária para ele.
      </PageNote>
    </main>
  );
}
