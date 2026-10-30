import { createClient } from "@/lib/supabase/server";
import { buscarProfile } from "@/lib/db/consultas";

// Usuário autenticado (Supabase Auth) da requisição atual, ou null.
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Perfil da aplicação (inclui o papel: PROFESSOR | COORDENACAO).
export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  return buscarProfile(user.id);
}
