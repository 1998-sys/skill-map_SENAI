# Melhoria 2 — Capacidades a partir do PDF do Plano de Curso

> **Objetivo:** o professor anexa o PDF do Plano de Curso e a IA encontra as
> capacidades, que ele revisa antes de salvar. Hoje as capacidades são coladas
> à mão, uma por linha.
> **Situação:** implementada (P1 a P4) e testada com o Plano de Curso de Auxiliar de
> Linha de Produção (95 páginas): 9 de 9 unidades encontradas, textos idênticos ao
> PDF, ~30 s. Falta conferir a importação na tela de uma turma existente.

## Regras (as mesmas do resto do SkillMap)

- **A IA sugere, o professor decide.** Nada é salvo sem a revisão e a
  confirmação do professor.
- **Texto fiel ao Plano de Curso.** A IA copia as capacidades como estão escritas
  no PDF — não resume, não reescreve, não inventa.
- Continua valendo a regra da análise: a IA só relaciona os relatos às
  capacidades que o professor salvou.

## Decisões (versão simples)

| Tema | Decisão |
|---|---|
| Onde aparece | No cadastro de **Nova turma** e na tela da turma, em **Capacidades do Curso** (botão **Importar do PDF**). |
| Unidade curricular | O Plano de Curso traz várias unidades curriculares. A IA lista as que encontrou e o professor **escolhe a da turma**. |
| Técnicas × socioemocionais | A IA separa os dois grupos, como o Plano de Curso já faz; o professor marca quais quer importar. Na turma, ficam salvas como capacidades comuns (o banco não guarda o tipo, como já era no MVP). |
| Guardar o PDF | **Não** por enquanto: o PDF é lido e descartado. Guardar (Supabase Storage) fica para depois. |
| Leitura do PDF | O servidor extrai o texto com `unpdf` e manda à IA **só as páginas com capacidades** (mais rápido e barato: 28 de 95 páginas no teste). PDF escaneado, sem texto, vai inteiro para a IA ler as imagens. |
| Tamanho máximo | **4 MB** (limite de envio das funções da Vercel). Ver "Limites". |

## Etapas

### P1 — Leitura do PDF pela IA (servidor)

- [ ] Função `extrairCapacidadesDoPdf` em `src/lib/ia/`: envia o PDF ao modelo
  com saída em **JSON Schema strict**:
  `unidades: [{ nome, capacidades_tecnicas: [], capacidades_socioemocionais: [] }]`.
- [ ] Prompt: copiar o texto literal; ignorar conhecimentos, bases tecnológicas,
  critérios de avaliação e referências; não inventar unidade nem capacidade.
- [ ] Limpeza do resultado: tirar numeração ("1.", "a)"), espaços duplicados e
  itens repetidos.

### P2 — Ação do servidor

- [ ] Server Action que recebe o arquivo: confere que é PDF e que tem até 4 MB,
  confere que o usuário está logado, chama a IA e devolve as unidades.
- [ ] Erros claros em português: "Envie um arquivo PDF", "O arquivo passa de
  4 MB", "Não encontramos capacidades neste PDF", "A IA demorou demais, tente de
  novo".
- [ ] Tempo máximo da função ajustado (a leitura pode levar de 20 a 60 s).

### P3 — Tela de importação (revisão)

- [ ] Botão **Importar do PDF** → escolher o arquivo → aviso "A IA está lendo o
  Plano de Curso…" (mesmo visual de carregamento da análise).
- [ ] Escolha da **unidade curricular** encontrada.
- [ ] Lista das capacidades com caixinhas (técnicas e socioemocionais
  separadas), todas marcadas por padrão; dá para **editar o texto** e
  **desmarcar** antes de confirmar.
- [ ] Botão **Usar estas capacidades**.

### P4 — Ligar nas duas telas

- [ ] **Nova turma:** as capacidades escolhidas vão para a caixa de texto
  (o professor ainda pode ajustar antes de criar a turma).
- [ ] **Tela da turma:** as escolhidas são adicionadas ao fim da lista existente
  (mesma ação do "Colar em bloco"), sem duplicar as que já existem.

### P5 — Testes e documentação

- [ ] Testar com Planos de Curso reais do SENAI (um com texto e, se houver, um
  escaneado).
- [ ] `tsc`, lint e `next build`.
- [ ] Atualizar `CLAUDE.md`, `docs/visao-geral-skillmap.html` (Melhoria 2 →
  implementada) e `docs/pontos-de-melhoria.md`.

## Limites e riscos

- **4 MB por PDF.** Planos de Curso maiores precisariam de envio direto para o
  Supabase Storage antes da leitura (fica para depois).
- **Tempo:** PDFs longos podem levar até cerca de 1 minuto para a IA ler.
- **Custo:** cada importação lê o PDF inteiro; com o `gpt-5-nano` o custo por
  importação é baixo, mas não é zero.
- **Precisão:** a IA pode errar a separação entre unidades ou cortar um texto —
  por isso a revisão do professor é obrigatória.

## Para depois

- Guardar o PDF no Supabase Storage (origem das capacidades rastreável).
- Guardar o tipo da capacidade (técnica / socioemocional) no banco.
- Planos de Curso acima de 4 MB.
