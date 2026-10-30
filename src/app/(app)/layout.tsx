import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { buscarProfile } from "@/lib/db/consultas";
import { AppShell } from "./app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Entrou com senha temporária (criada pela Coordenação): precisa criar a
  // própria senha antes de usar o sistema.
  if (user.app_metadata?.trocar_senha) redirect("/definir-senha");

  const profile = await buscarProfile(user.id);
  if (!profile) redirect("/login");

  return (
    <AppShell role={profile.role} nome={profile.nome}>
      {children}
    </AppShell>
  );
}
