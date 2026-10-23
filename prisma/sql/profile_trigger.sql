-- Trigger de criação automática de profile.
--
-- NÃO entra nas migrations do Prisma porque referencia o schema `auth`
-- (que não existe no shadow database usado pelo Prisma Migrate).
-- Aplicar manualmente após as migrations, com:
--   node --env-file=.env scripts/db/apply-profile-trigger.mjs
--
-- Cria um registro em public.profiles sempre que um usuário é criado no
-- Supabase Auth. Papel padrão: PROFESSOR (definível via user_metadata.role).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
