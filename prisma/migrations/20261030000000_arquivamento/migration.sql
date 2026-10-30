-- Arquivamento (exclusão lógica) de turmas e registros pela Coordenação.
--
-- Nada é apagado do banco: a turma/registro ganha a data e o autor do
-- arquivamento e some das telas. Mantém a rastreabilidade da spec
-- ("registros enviados nunca são apagados") e permite restaurar.
--
-- Idempotente (IF NOT EXISTS): pode ser aplicado no SQL Editor do Supabase
-- (a rede do SENAI bloqueia o `prisma migrate`) e depois pelo Prisma sem erro.

ALTER TABLE "turmas"    ADD COLUMN IF NOT EXISTS "excluido_em"  TIMESTAMP(3);
ALTER TABLE "turmas"    ADD COLUMN IF NOT EXISTS "excluido_por" UUID;
ALTER TABLE "registros" ADD COLUMN IF NOT EXISTS "excluido_em"  TIMESTAMP(3);
ALTER TABLE "registros" ADD COLUMN IF NOT EXISTS "excluido_por" UUID;
