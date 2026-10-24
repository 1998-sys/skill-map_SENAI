# Etapa 4 — Envio à Coordenação + Rastreabilidade

> **Status:** ✅ Concluída
> **Depende de:** Etapa 3

## 🎯 Objetivo
Permitir que o professor **valide e envie** cada análise diária à Coordenação, com
status, versionamento e rastreabilidade — sem transformar o SkillMap em burocracia.

## 🧰 Tecnologias
- Next.js (Server Actions)
- Prisma (status, versões, carimbo de envio)

## ✅ Tarefas
- [x] Status do registro: `Rascunho` e `Enviado à Coordenação`
- [x] Botão **"Enviar à Coordenação"** na tela de análise (só o dia/aula aberto; exige análise validada)
- [x] Registrar automaticamente **data/hora** do envio (professor e turma já vêm do registro)
- [x] Após envio, **preservar conteúdo** (registro e análise ficam read-only) e marcar "Enviado à Coordenação"
- [x] Correção posterior via **"Reabrir para correção"** → nova validação gera nova versão, sem apagar as anteriores
- [x] Envio **não obrigatório** — o professor decide quando enviar

**Testado:** registro com análise validada → "Enviar à Coordenação" → status muda, data/hora
("Enviado à Coordenação em 23/10/2026, 21:35"), formulário e painel read-only, botão "Reabrir" disponível.

## 📦 Entregável (critério de conclusão)
Professor valida uma análise e a envia; o sistema guarda data/hora/responsável, o
registro fica como "Enviado à Coordenação" e correções geram nova versão rastreável.

## 📝 Notas da especificação
- Após o envio, preservar conteúdo e rastreabilidade.
- Nunca apagar registros enviados — usar versão para preservar histórico.
