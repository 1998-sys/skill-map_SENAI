import type { Role } from "@/lib/types";
import { db, exigir, lerDia, lerInstante } from "./cliente";

// Consultas de LEITURA do SkillMap via supabase-js (Data API, HTTPS).
//
// Como funciona o `select` do supabase-js:
//   - "nomeNoCodigo:nome_no_banco" renomeia a coluna na resposta. Assim o
//     banco continua em snake_case e o código em camelCase (como no Prisma).
//   - "curso:cursos(nome)" traz a tabela relacionada pela chave estrangeira
//     (turmas.curso_id → cursos.id), como o `include` do Prisma.
//   - "capacidades(count)" traz só a contagem da tabela relacionada.
// As escritas (insert/update/delete) ficam nas Server Actions.

export type RegistroStatus = "RASCUNHO" | "ENVIADO";
export type AnaliseTipo = "IA_ORIGINAL" | "VALIDADA";

export type Profile = { id: string; email: string; nome: string; role: Role };

export type Capacidade = { id: string; texto: string; ordem: number };

export type Turma = {
  id: string;
  nome: string;
  periodo: string | null;
  cargaHoraria: number | null;
  professorId: string;
  curso: { nome: string };
  professor: { nome: string };
};

export type Registro = {
  id: string;
  turmaId: string;
  professorId: string;
  data: Date; // dia da aula (meia-noite UTC)
  tema: string | null;
  textoTrabalhado: string;
  textoDesempenho: string;
  textoObservacoes: string | null;
  status: RegistroStatus;
  enviadoEm: Date | null;
};

export type Analise = {
  id: string;
  tipo: AnaliseTipo;
  versao: number;
  pontosPositivos: string[];
  pontosAtencao: string[];
  sugestoes: string[];
  observacoesAdicionais: string | null;
  capacidades: Capacidade[]; // identificadas, na ordem do Plano de Curso
};

export type RegistroComTurma = Registro & { turma: Turma };
export type RegistroComAnalise = Registro & { ultimaAnalise: Analise | null };

// ─── Colunas pedidas em cada select ─────────────────────────────────────────

const SEL_TURMA =
  "id, nome, periodo, cargaHoraria:carga_horaria, professorId:professor_id, " +
  "curso:cursos(nome), professor:profiles(nome)";

const SEL_REGISTRO =
  "id, turmaId:turma_id, professorId:professor_id, data, tema, " +
  "textoTrabalhado:texto_trabalhado, textoDesempenho:texto_desempenho, " +
  "textoObservacoes:texto_observacoes, status, enviadoEm:enviado_em";

const SEL_ANALISE =
  "id, tipo, versao, pontosPositivos:pontos_positivos, " +
  "pontosAtencao:pontos_atencao, sugestoes, " +
  "observacoesAdicionais:observacoes_adicionais, " +
  "analise_capacidades(capacidade:capacidades(id, texto, ordem))";

// ─── Conversão da linha do banco para o tipo do código ──────────────────────
// A Data API devolve datas como texto; aqui viram Date.

type LinhaRegistro = Omit<Registro, "data" | "enviadoEm"> & {
  data: string;
  enviadoEm: string | null;
};

type LinhaAnalise = Omit<Analise, "capacidades"> & {
  analise_capacidades: { capacidade: Capacidade }[];
};

function paraRegistro<T extends LinhaRegistro>(
  linha: T,
): Omit<T, "data" | "enviadoEm"> & Registro {
  return {
    ...linha,
    data: lerDia(linha.data),
    enviadoEm: lerInstante(linha.enviadoEm),
  };
}

function paraAnalise(linha: LinhaAnalise): Analise {
  const { analise_capacidades, ...resto } = linha;
  return {
    ...resto,
    capacidades: analise_capacidades
      .map((ac) => ac.capacidade)
      .sort((a, b) => a.ordem - b.ordem),
  };
}

// ─── Perfis ─────────────────────────────────────────────────────────────────

export async function buscarProfile(id: string): Promise<Profile | null> {
  return exigir<Profile | null>(
    await db()
      .from("profiles")
      .select("id, email, nome, role")
      .eq("id", id)
      .maybeSingle(), // 0 ou 1 linha (sem erro se não achar)
  );
}

// ─── Turmas ─────────────────────────────────────────────────────────────────

export async function buscarTurma(id: string): Promise<Turma | null> {
  return exigir<Turma | null>(
    await db().from("turmas").select(SEL_TURMA).eq("id", id).maybeSingle(),
  );
}

export async function listarTurmasDoProfessor(professorId: string) {
  type Linha = {
    id: string;
    nome: string;
    curso: { nome: string };
    capacidades: { count: number }[];
    registros: { count: number }[];
  };
  const linhas = exigir<Linha[]>(
    await db()
      .from("turmas")
      .select("id, nome, curso:cursos(nome), capacidades(count), registros(count)")
      .eq("professor_id", professorId)
      .order("created_at", { ascending: false }),
  );
  return linhas.map((t) => ({
    id: t.id,
    nome: t.nome,
    curso: t.curso,
    totalCapacidades: t.capacidades[0]?.count ?? 0,
    totalRegistros: t.registros[0]?.count ?? 0,
  }));
}

// Turmas com ao menos um registro ENVIADO (painel da Coordenação).
// "registros!inner" funciona como um INNER JOIN: turmas sem registro enviado
// ficam de fora.
export async function listarTurmasComEnvios() {
  type Linha = {
    id: string;
    nome: string;
    curso: { nome: string };
    professor: { nome: string };
    registros: { enviadoEm: string | null }[];
  };
  const linhas = exigir<Linha[]>(
    await db()
      .from("turmas")
      .select(
        "id, nome, curso:cursos(nome), professor:profiles(nome), " +
          "registros!inner(enviadoEm:enviado_em)",
      )
      .eq("registros.status", "ENVIADO"),
  );
  return linhas.map(({ registros, ...t }) => ({
    ...t,
    envios: registros.map((r) => lerInstante(r.enviadoEm)),
  }));
}

// ─── Capacidades ────────────────────────────────────────────────────────────

export async function listarCapacidades(turmaId: string): Promise<Capacidade[]> {
  return exigir<Capacidade[]>(
    await db()
      .from("capacidades")
      .select("id, texto, ordem")
      .eq("turma_id", turmaId)
      .order("ordem"),
  );
}

// ─── Registros ──────────────────────────────────────────────────────────────

export async function listarRegistrosDaTurma(turmaId: string): Promise<Registro[]> {
  const linhas = exigir<LinhaRegistro[]>(
    await db()
      .from("registros")
      .select(SEL_REGISTRO)
      .eq("turma_id", turmaId)
      .order("data", { ascending: false }),
  );
  return linhas.map(paraRegistro);
}

export async function buscarRegistro(id: string): Promise<RegistroComTurma | null> {
  const linha = exigir<(LinhaRegistro & { turma: Turma }) | null>(
    await db()
      .from("registros")
      .select(`${SEL_REGISTRO}, turma:turmas(${SEL_TURMA})`)
      .eq("id", id)
      .maybeSingle(),
  );
  return linha ? paraRegistro(linha) : null;
}

// Registros da turma, cada um com a sua ÚLTIMA análise (maior versão).
// `order` e `limit` com `referencedTable` agem dentro da tabela relacionada,
// separadamente para cada registro.
export async function listarRegistrosComUltimaAnalise(
  turmaId: string,
  filtros: { status?: RegistroStatus; tipoAnalise?: AnaliseTipo } = {},
): Promise<RegistroComAnalise[]> {
  let consulta = db()
    .from("registros")
    .select(`${SEL_REGISTRO}, analises(${SEL_ANALISE})`)
    .eq("turma_id", turmaId);
  if (filtros.status) consulta = consulta.eq("status", filtros.status);
  if (filtros.tipoAnalise) consulta = consulta.eq("analises.tipo", filtros.tipoAnalise);

  const linhas = exigir<(LinhaRegistro & { analises: LinhaAnalise[] })[]>(
    await consulta
      .order("data", { ascending: false })
      .order("versao", { referencedTable: "analises", ascending: false })
      .limit(1, { referencedTable: "analises" }),
  );
  return linhas.map(({ analises, ...r }) => ({
    ...paraRegistro(r),
    ultimaAnalise: analises[0] ? paraAnalise(analises[0]) : null,
  }));
}

// ─── Análises ───────────────────────────────────────────────────────────────

export async function contarAnalises(registroId: string): Promise<number> {
  const { count, error } = await db()
    .from("analises")
    .select("id", { count: "exact", head: true }) // só a contagem, sem linhas
    .eq("registro_id", registroId);
  if (error) throw new Error(`Banco: ${error.message}`);
  return count ?? 0;
}

export async function buscarUltimaAnalise(
  registroId: string,
  tipo?: AnaliseTipo,
): Promise<Analise | null> {
  let consulta = db().from("analises").select(SEL_ANALISE).eq("registro_id", registroId);
  if (tipo) consulta = consulta.eq("tipo", tipo);
  const linha = exigir<LinhaAnalise | null>(
    await consulta.order("versao", { ascending: false }).limit(1).maybeSingle(),
  );
  return linha ? paraAnalise(linha) : null;
}

// Maior versão de análise do registro (0 se não houver nenhuma).
export async function ultimaVersaoAnalise(registroId: string): Promise<number> {
  const linha = exigir<{ versao: number } | null>(
    await db()
      .from("analises")
      .select("versao")
      .eq("registro_id", registroId)
      .order("versao", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
  return linha?.versao ?? 0;
}
