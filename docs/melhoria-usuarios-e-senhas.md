# Melhoria — Gestão de usuários e redefinição de senha

> **Escopo:** a **Coordenação** gerencia os acessos: cria usuários, gera senha
> temporária e desativa/reativa. O professor não cria nem exclui usuários.
> **Versão simples (sem e-mail):** nada depende de envio de e-mail por enquanto.
> **Situação:** U1 a U6 implementadas na branch `feat/usuarios-coordenacao`; faltam os testes de ponta a ponta com contas reais (U7).

## Decisões

| Tema | Decisão |
|---|---|
| Criar acesso | A Coordenação cadastra **nome, e-mail e papel**; o sistema gera uma **senha temporária**, mostrada uma única vez, que a Coordenação repassa ao professor. |
| Primeiro acesso | Com a senha temporária, o professor é levado direto para **criar uma senha nova** antes de usar o sistema. |
| Esqueci minha senha | O link no login orienta a **procurar a Coordenação**, que gera uma nova senha temporária. |
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

## Para depois (versão com e-mail)

- "Esqueci minha senha" por e-mail e convite por e-mail. Exige configurar **SMTP
  próprio** no Supabase: o envio padrão só entrega para e-mails da equipe do
  projeto e tem limite de poucos e-mails por hora. Opções: Microsoft 365
  (`smtp.office365.com`, porta 587, com SMTP AUTH liberado pela TI) ou um serviço
  de e-mail transacional (Brevo, Resend…).
- Entrar com a conta Microsoft (login único do Outlook/Microsoft 365).
- Trocar o papel de um usuário existente e transferir turmas de um professor
  desativado.
