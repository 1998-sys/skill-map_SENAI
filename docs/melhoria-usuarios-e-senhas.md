# Melhoria — Gestão de usuários e redefinição de senha

> **Escopo:** a **Coordenação** gerencia os acessos: cria usuários, gera senha
> temporária e desativa/reativa. O professor não cria nem exclui usuários.
> **Versão simples (sem e-mail):** nada depende de envio de e-mail por enquanto.
> **Situação:** U1 a U7 no ar. **U8 — "Esqueci minha senha" por e-mail** implementada
> na branch `feat/reset-senha-email`.

## Decisões

| Tema | Decisão |
|---|---|
| Criar acesso | A Coordenação cadastra **nome, e-mail e papel**; o sistema gera uma **senha temporária**, mostrada uma única vez, que a Coordenação repassa ao professor. |
| Primeiro acesso | Com a senha temporária, o professor é levado direto para **criar uma senha nova** antes de usar o sistema. |
| Esqueci minha senha | **Por e-mail** (U8): o usuário informa o e-mail e recebe um link para criar a senha nova. Plano B: a Coordenação gera uma senha temporária. |
| "Excluir" usuário | **Desativar o acesso**: não consegue mais entrar, mas o nome continua nas turmas e registros (rastreabilidade). Pode ser reativado. |

## Etapas

### U1 — Criar a própria senha (troca obrigatória)

- [ ] Página `/definir-senha` (fora do menu lateral): nova senha + confirmação,
  mínimo de 8 caracteres. Ao salvar, vai para o Início.
- [ ] Usuário com senha temporária é marcado (`app_metadata.trocar_senha`, que só
  o servidor altera) e, ao entrar, é levado para `/definir-senha` — não consegue
  usar o sistema antes de trocar.

### U2 — "Esqueci minha senha"

- [ ] Link **Esqueci minha senha** na tela de login → página pública
  `/esqueci-senha` explicando que a Coordenação gera uma senha temporária.
- [ ] Login de usuário desativado mostra "Seu acesso está desativado. Procure a
  Coordenação." (em vez de "senha inválida").

### U3 — Tela "Usuários" (só Coordenação)

- [ ] Item **Usuários** no menu da Coordenação → `/coordenacao/usuarios`.
- [ ] Lista com nome, e-mail, papel, situação e último acesso. Situações:
  **Ativo**, **Aguardando troca de senha**, **Desativado**.
- [ ] Professor que abrir o endereço é redirecionado (checagem no servidor).

### U4 — Criar usuário

- [ ] Formulário: nome, e-mail e papel (padrão: Professor).
- [ ] Cria o login no Supabase Auth já confirmado, com a senha temporária; o
  gatilho `handle_new_user` cria o perfil com nome e papel.
- [ ] A senha temporária aparece uma vez, com botão de copiar e o texto pronto
  para repassar ao professor.
- [ ] E-mail já cadastrado → mensagem clara, sem duplicar.

### U5 — Gerar nova senha temporária

- [ ] Ação **Gerar senha temporária** em cada usuário (com confirmação). Marca a
  troca obrigatória no próximo acesso.
- [ ] Não vale para o próprio usuário logado (ele troca a senha normalmente).

### U6 — Desativar e reativar

- [ ] Ação **Desativar acesso** (confirmação em dois passos) e **Reativar acesso**.
  O login é bloqueado no Supabase Auth; perfil, turmas e registros continuam.
- [ ] Travas: a Coordenação **não pode desativar a si mesma** nem o **último
  usuário de Coordenação** ativo.

### U7 — Testes e documentação

- [ ] `tsc`, lint e `next build`.
- [ ] Testes de ponta a ponta: criar usuário → entrar com a senha temporária →
  troca obrigatória → entrar com a senha nova; gerar nova senha temporária;
  desativar → login recusado com a mensagem certa; reativar; professor sem acesso
  à tela e às ações.
- [ ] Atualizar `CLAUDE.md`, `docs/visao-geral-skillmap.html` e
  `docs/pontos-de-melhoria.md`.

## Regras de segurança

- Toda ação de gestão confere o papel **COORDENACAO no servidor** (não só esconde
  botões).
- Operações de administração usam a chave secreta (*service role*), **só no
  servidor**.
- Senha temporária mostrada uma vez, nunca gravada em log nem nas tabelas do app.
- A marca de "trocar senha" fica em `app_metadata`, que o próprio usuário não
  consegue alterar.

### U8 — "Esqueci minha senha" por e-mail

- [x] **Supabase (painel):** SMTP próprio Gmail (`smtp.gmail.com:587`, remetente
  `skillmap.senai@gmail.com`, nome "SkillMap SENAI", limite de 30 e-mails/hora);
  URL Configuration com Site URL `https://skill-map-senai.vercel.app` e Redirect
  URLs `…/auth/confirm` (produção e `http://localhost:3000`); template "Reset
  Password" no padrão SSR (com `token_hash`, funciona em outro navegador/celular):
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/definir-senha`
- [x] `/esqueci-senha`: formulário de e-mail → action `solicitarReset`
  (`resetPasswordForEmail`). Sempre a mesma mensagem, exista ou não o e-mail;
  limite de envio → "Muitos pedidos agora…". Plano B (Coordenação) continua citado.
- [x] `/auth/confirm`: `verifyOtp({ token_hash, type: "recovery" })` abre a sessão e
  leva para `next` (só caminhos internos; senão `/definir-senha`). Link vencido ou
  usado → `/login?erro=link-invalido`, que mostra o aviso.
- [x] `/definir-senha` com texto que serve para senha temporária e para o e-mail.

## Para depois

- Convite de usuário por e-mail (a rota `/auth/confirm` pode aceitar `type=invite`).
- Trocar o Gmail pelo SMTP do Microsoft 365 do SENAI (só muda o painel do Supabase).
- Entrar com a conta Microsoft (login único do Outlook/Microsoft 365).
- Trocar o papel de um usuário existente e transferir turmas de um professor
  desativado.
