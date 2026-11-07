-- Calendário da turma (Dashboard, onda 2).
--
-- O professor informa início, término, dias da semana e horas por dia; o
-- sistema gera as datas de aula (sem feriados nacionais) e o professor ajusta
-- clicando nos dias. Guardamos a regra (para editar) e a LISTA FINAL das datas
-- (para os indicadores: aulas previstas, ocorridas e sem registro).
--
-- Idempotente (IF NOT EXISTS): aplicar no SQL Editor do Supabase (a rede do
-- SENAI bloqueia o `prisma migrate`) e depois pelo Prisma sem erro.
-- Turmas antigas ficam com tudo vazio e continuam funcionando como antes.

ALTER TABLE "turmas" ADD COLUMN IF NOT EXISTS "data_inicio"   DATE;
ALTER TABLE "turmas" ADD COLUMN IF NOT EXISTS "data_fim"      DATE;
ALTER TABLE "turmas" ADD COLUMN IF NOT EXISTS "dias_semana"   INTEGER[];          -- 0 = domingo … 6 = sábado
ALTER TABLE "turmas" ADD COLUMN IF NOT EXISTS "horas_por_dia" DOUBLE PRECISION;
ALTER TABLE "turmas" ADD COLUMN IF NOT EXISTS "datas_aula"    DATE[];             -- lista final, já com os ajustes
