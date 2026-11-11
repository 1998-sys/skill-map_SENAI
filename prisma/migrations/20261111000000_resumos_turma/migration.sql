-- Resumo da turma com IA guardado (Acompanhamento da Coordenação).
--
-- Cada vez que a Coordenação gera o resumo, o texto final fica salvo com a
-- data, quem gerou e quantos registros enviados ele considerou. A tela mostra
-- o último; os anteriores ficam como histórico. Serve de base documental para
-- reuniões (página de impressão).
--
-- Idempotente (IF NOT EXISTS): aplicar no SQL Editor do Supabase (a rede do
-- SENAI bloqueia o `prisma migrate`) e depois pelo Prisma sem erro.

CREATE TABLE IF NOT EXISTS "resumos_turma" (
    "id"              UUID         NOT NULL,
    "turma_id"        UUID         NOT NULL,
    "texto"           TEXT         NOT NULL,
    "total_registros" INTEGER      NOT NULL,
    "gerado_por"      UUID,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "resumos_turma_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "resumos_turma_turma_id_fkey" FOREIGN KEY ("turma_id")
        REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "resumos_turma_turma_id_created_at_idx"
    ON "resumos_turma"("turma_id", "created_at");

-- Mesmo padrão das outras tabelas: RLS ligado, sem políticas (o app acessa
-- só pelo servidor, com a chave service role).
ALTER TABLE "resumos_turma" ENABLE ROW LEVEL SECURITY;
