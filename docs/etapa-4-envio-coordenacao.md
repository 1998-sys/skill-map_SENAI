# Etapa 4 — Envio à Coordenação + Rastreabilidade

> **Status:** ⬜ Pendente
> **Depende de:** Etapa 3

## 🎯 Objetivo
Permitir que o professor **valide e envie** cada análise diária à Coordenação, com
status, versionamento e rastreabilidade — sem transformar o SkillMap em burocracia.

## 🧰 Tecnologias
- Next.js (Server Actions)
- Prisma (status, versões, carimbo de envio)

## ✅ Tarefas
- [ ] Campo de **status** no registro: `Rascunho/Salvo` e `Enviado à Coordenação`
- [ ] Botão **"Enviar análise para Coordenação"** na tela de análise (só o dia/aula aberto)
- [ ] Registrar automaticamente **data/hora, professor responsável e turma** no envio
- [ ] Após envio, **preservar conteúdo** e marcar como "Enviado à Coordenação"
- [ ] Correção posterior → **nova versão**, sem apagar o registro anterior
- [ ] Envio **não obrigatório** ao fim de toda aula (professor decide quando está pronto)

## 📦 Entregável (critério de conclusão)
Professor valida uma análise e a envia; o sistema guarda data/hora/responsável, o
registro fica como "Enviado à Coordenação" e correções geram nova versão rastreável.

## 📝 Notas da especificação
- Após o envio, preservar conteúdo e rastreabilidade.
- Nunca apagar registros enviados — usar versão para preservar histórico.
