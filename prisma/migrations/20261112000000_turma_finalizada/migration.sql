-- Turma finalizada.
--
-- Ao terminar o curso, o professor finaliza a turma: ela sai das turmas "em
-- andamento", deixa de gerar alertas e fica só para consulta (sem novos
-- registros). A Coordenação pode reabrir. Nada é apagado.
--
-- Idempotente (IF NOT EXISTS): aplicar no SQL Editor do Supabase (a rede do
-- SENAI bloqueia o `prisma migrate`) e depois pelo Prisma sem erro.

ALTER TABLE "turmas" ADD COLUMN IF NOT EXISTS "finalizada_em"  TIMESTAMP(3);
ALTER TABLE "turmas" ADD COLUMN IF NOT EXISTS "finalizada_por" UUID; -- profiles.id de quem finalizou
