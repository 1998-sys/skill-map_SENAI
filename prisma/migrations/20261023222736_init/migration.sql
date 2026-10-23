-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PROFESSOR', 'COORDENACAO');

-- CreateEnum
CREATE TYPE "RegistroStatus" AS ENUM ('RASCUNHO', 'ENVIADO');

-- CreateEnum
CREATE TYPE "AnaliseTipo" AS ENUM ('IA_ORIGINAL', 'VALIDADA');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PROFESSOR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cursos" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turmas" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "periodo" TEXT,
    "carga_horaria" INTEGER,
    "curso_id" UUID NOT NULL,
    "professor_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turmas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capacidades" (
    "id" UUID NOT NULL,
    "turma_id" UUID NOT NULL,
    "texto" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "capacidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros" (
    "id" UUID NOT NULL,
    "turma_id" UUID NOT NULL,
    "professor_id" UUID NOT NULL,
    "data" DATE NOT NULL,
    "tema" TEXT,
    "texto_trabalhado" TEXT NOT NULL,
    "texto_desempenho" TEXT NOT NULL,
    "texto_observacoes" TEXT,
    "status" "RegistroStatus" NOT NULL DEFAULT 'RASCUNHO',
    "enviado_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analises" (
    "id" UUID NOT NULL,
    "registro_id" UUID NOT NULL,
    "tipo" "AnaliseTipo" NOT NULL,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "pontos_positivos" TEXT[],
    "pontos_atencao" TEXT[],
    "sugestoes" TEXT[],
    "observacoes_adicionais" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analise_capacidades" (
    "analise_id" UUID NOT NULL,
    "capacidade_id" UUID NOT NULL,

    CONSTRAINT "analise_capacidades_pkey" PRIMARY KEY ("analise_id","capacidade_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "registros_turma_id_data_idx" ON "registros"("turma_id", "data");

-- CreateIndex
CREATE INDEX "analises_registro_id_idx" ON "analises"("registro_id");

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_professor_id_fkey" FOREIGN KEY ("professor_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capacidades" ADD CONSTRAINT "capacidades_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros" ADD CONSTRAINT "registros_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros" ADD CONSTRAINT "registros_professor_id_fkey" FOREIGN KEY ("professor_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analises" ADD CONSTRAINT "analises_registro_id_fkey" FOREIGN KEY ("registro_id") REFERENCES "registros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analise_capacidades" ADD CONSTRAINT "analise_capacidades_analise_id_fkey" FOREIGN KEY ("analise_id") REFERENCES "analises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analise_capacidades" ADD CONSTRAINT "analise_capacidades_capacidade_id_fkey" FOREIGN KEY ("capacidade_id") REFERENCES "capacidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
