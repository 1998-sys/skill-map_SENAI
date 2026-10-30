-- Liga o RLS (Row Level Security) em todas as tabelas do schema public.
--
-- POR QUÊ: sem RLS, a Data API do Supabase deixa qualquer pessoa com a chave
-- pública (NEXT_PUBLIC_SUPABASE_ANON_KEY, que vai para o navegador) LER e
-- ALTERAR todas as tabelas, mesmo sem login.
--
-- COMO FICA: RLS ligado e NENHUMA policy = ninguém acessa pela chave pública
-- (nem anônimo, nem usuário logado). O app continua funcionando porque:
--   - o servidor usa a chave secreta (service role), que ignora o RLS;
--   - o Prisma (migrations) conecta como dono das tabelas, que também ignora;
--   - o trigger de profile é SECURITY DEFINER (roda como dono).
-- Se um dia o navegador precisar ler direto do banco, crie policies
-- específicas (ex.: "professor lê só as próprias turmas").
--
-- Aplicar: Supabase → SQL Editor → colar e rodar. Pode rodar mais de uma vez.
-- Não entra nas migrations do Prisma (é configuração do Supabase).

alter table public.profiles            enable row level security;
alter table public.cursos              enable row level security;
alter table public.turmas              enable row level security;
alter table public.capacidades         enable row level security;
alter table public.registros           enable row level security;
alter table public.analises            enable row level security;
alter table public.analise_capacidades enable row level security;
alter table public._prisma_migrations  enable row level security;

-- Conferência: todas devem aparecer com rls_ligado = true.
select tablename, rowsecurity as rls_ligado
from pg_tables
where schemaname = 'public'
order by tablename;
