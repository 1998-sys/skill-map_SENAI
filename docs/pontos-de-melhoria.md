# Pontos de melhoria — pós-migração para supabase-js

Levantados em 29/10/2026, depois dos PRs #1 (acesso ao banco via supabase-js) e
#2 (RLS ligado). O sistema está funcionando; os itens abaixo são conferências,
arrumações e cuidados para o futuro.

Legenda de prioridade: 🔴 alta · 🟡 média · 🟢 baixa

---

## 1. Conferir

- [ ] 🔴 **Testar a produção logado.** Entrar em
  `skill-map-senai.vercel.app`, abrir o painel, uma turma, um registro e a
  análise. O preview foi testado; a produção só foi conferida nas páginas
  públicas (login respondeu HTTP 200).

## 2. Arrumação

- [ ] 🟢 **Apagar a branch `teste/conexao-supabase-js`** no GitHub (botão
  *Delete branch* no PR #2). Já foi toda juntada na `main`.
- [ ] 🟢 **Apagar `pr-supabase-js.md`** (fora do repositório, na pasta
  `MACHINE LEARNING`). Era só o rascunho da descrição do PR.
- [ ] 🟢 **`package-lock.json` alterado localmente** pelo `npm install` da
  máquina do laboratório. Não foi commitado de propósito; descartar com
  `git checkout package-lock.json` se não for necessário.

## 3. Cuidados daqui para frente

- [ ] 🔴 **Toda tabela nova precisa de RLS.** Sem RLS, a chave pública (que vai
  para o navegador) lê e altera a tabela sem login. Depois de criar a tabela,
  rodar no SQL Editor:
  ```sql
  alter table public.<nova_tabela> enable row level security;
  ```
  Referência: `prisma/sql/rls.sql`.
- [ ] 🟡 **Migrations não rodam na rede do SENAI.** O `prisma migrate` usa
  conexão Postgres (porta 5432), que a rede bloqueia. Alternativas: rodar de
  outra rede, rodar no Codespaces, ou aplicar o SQL direto no SQL Editor do
  Supabase.
- [ ] 🟡 **Gravações novas precisam gerar `id` e `updated_at` no código.** O
  banco não tem valor padrão para essas colunas (antes era o Prisma). Usar
  `novoId()` e `agora()` de `@/lib/db/cliente`.
- [ ] 🟡 **Datas lidas do banco passam pelos helpers.** Instantes vêm sem fuso
  → `lerInstante()`; coluna `date` → `lerDia()`. Sem isso, os horários ficam
  3 horas errados.

## 4. Acessos e senhas

Hoje a Coordenação cria os usuários e gera senha temporária quando alguém
esquece (versão sem e-mail). Próximos passos, para tirar a Coordenação desse
caminho:

- [ ] 🟡 **Recuperação de senha por e-mail.** "Esqueci minha senha" envia ao
  Outlook um link de redefinição que abre o SkillMap na tela de criar senha
  (`/definir-senha` já existe). Mensagem sempre neutra, sem revelar quem tem
  conta.
- [ ] 🟡 **Cadastro automatizado, sem passar pela Coordenação.** O professor se
  cadastra com o e-mail institucional (só o domínio da escola, ex.:
  `@sp.senai.br`, conferido no servidor), confirma o endereço por e-mail e entra
  como Professor. Promover a Coordenação continua manual; a Coordenação mantém o
  poder de desativar.
- [ ] 🔴 **Pré-requisito dos dois itens: SMTP próprio no Supabase.** O envio
  padrão só entrega para e-mails da equipe do projeto e tem limite de poucos
  e-mails por hora. Opções: Microsoft 365 (`smtp.office365.com`, porta 587, com
  SMTP AUTH liberado pela TI) ou serviço transacional (Brevo, Resend…). Também
  configurar URL Configuration e os modelos de e-mail em português.
- [ ] 🟢 **Alternativa: entrar com a conta Microsoft.** Login único do Outlook/
  Microsoft 365 resolve cadastro e recuperação de senha de uma vez (a senha é a
  da escola). Exige registrar o SkillMap no Azure AD com a TI.

Plano detalhado: `docs/melhoria-usuarios-e-senhas.md`.

## 5. Melhorias técnicas sugeridas

- [ ] 🟡 **Gravações atômicas com função no banco (RPC).** Criar turma
  (curso + turma + capacidades) e salvar análise (análise + capacidades) hoje
  são inserts separados, com desfazimento manual se um falhar. Uma função SQL
  chamada por `db().rpc(...)` faria tudo numa transação de verdade.
- [ ] 🟡 **Valor padrão no banco para `id` e `updated_at`.** Adicionar
  `default gen_random_uuid()` e `default now()` (mais um trigger para
  `updated_at`) deixaria o banco mais seguro contra esquecimentos no código.
  Exige migration — ver o item sobre a rede.
- [ ] 🟡 **Vulnerabilidades do npm.** O `npm install` apontou 6 (3 baixas,
  3 altas). Avaliar com `npm audit`, **sem** `npm audit fix --force` — ele
  pode subir o Prisma para uma versão que quebra o projeto (ver `CLAUDE.md`).
- [ ] 🟢 **Tipos gerados do banco.** Gerar os tipos com
  `supabase gen types typescript` e passar para o `createClient<Database>()`.
  Hoje os formatos das linhas são declarados à mão em `consultas.ts`.
- [ ] 🟢 **Aviso do Next.js: `middleware` → `proxy`.** O build avisa que a
  convenção `middleware.ts` foi descontinuada. Migrar com
  `npx @next/codemod@canary middleware-to-proxy .` e testar o login.
- [ ] 🟢 **Página `/teste-conexao` em produção.** Qualquer usuário logado
  consegue abrir. Ela só mostra contagens, mas pode ficar restrita à
  Coordenação ou só ao ambiente de desenvolvimento.
- [ ] 🟢 **Prisma só para estrutura.** O cliente do Prisma (`src/lib/prisma.ts`)
  hoje só é usado pela `/teste-conexao`. Se essa página sair, o Prisma fica
  apenas para schema e migrations.

## 6. Para o curso

- O caminho que funciona no laboratório é **HTTPS**: painel web do Supabase
  (SQL Editor), `supabase-py` / `supabase-js`, ou ambientes na nuvem
  (Google Colab, GitHub Codespaces).
- Testar num computador do **próprio laboratório** antes da primeira aula.
- Pedido à TI (se quiserem liberar Prisma/psycopg2 no laboratório): saída TCP
  na porta **6543** (e 5432) para `*.pooler.supabase.com`.
- Material pronto no repositório: `src/lib/db/consultas.ts` (consultas
  comentadas), `src/lib/teste-conexao.ts` e a página `/teste-conexao`
  (comparação entre os dois tipos de conexão), `prisma/sql/rls.sql` (RLS
  comentado).
