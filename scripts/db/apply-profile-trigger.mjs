// Aplica o trigger de criação de profile direto no banco (via DIRECT_URL).
// Uso: node --env-file=.env scripts/db/apply-profile-trigger.mjs
import { PrismaClient } from "@prisma/client";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const prisma = new PrismaClient({ datasources: { db: { url } } });

const funcao = `
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
begin
  insert into public.profiles (id, email, nome, role, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::"Role", 'PROFESSOR'::"Role"),
    now(),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$func$;
`;

try {
  await prisma.$executeRawUnsafe(funcao);
  await prisma.$executeRawUnsafe(
    `drop trigger if exists on_auth_user_created on auth.users;`,
  );
  await prisma.$executeRawUnsafe(
    `create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();`,
  );
  console.log("✔ Trigger on_auth_user_created aplicado com sucesso.");
} catch (e) {
  console.error("✘ Falha ao aplicar o trigger:", e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
