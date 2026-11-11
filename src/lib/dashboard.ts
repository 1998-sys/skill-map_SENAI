import { db, exigir, lerDia, lerInstante } from "@/lib/db/cliente";
import { calcularCobertura, type Cobertura } from "@/lib/calendario";
import { diaISOEmBrasilia } from "@/lib/datas";
import { listarUsuarios } from "@/lib/db/usuarios";

// Dashboard de acompanhamento da Coordenação.
// Onda 1: funil, registros por semana e tempo até o envio (Registro + Analise).
// Onda 2: cobertura do calendário — aulas previstas, ocorridas, com registro e
// enviadas — para as turmas que têm calendário (turmas.datas_aula).
// Painel único (Dashboard): + alertas, últimos envios, pontos de atenção mais
// frequentes, acessos e excluídos (obterPainelCoordenacao).
// Tudo somente leitura; a Coordenação vê TODAS as turmas.

const MS_DIA = 24 * 60 * 60 * 1000;

export type FunilRegistros = {
  sem: number; // rascunho sem nenhuma análise
  gerada: number; // rascunho com análise da IA, ainda não validada
  validada: number; // rascunho com análise validada, ainda não enviada
  enviada: number; // enviado à Coordenação
};

export type TurmaDashboard = {
  id: string;
  nome: string;
  cursoNome: string;
  professorNome: string;
  totalRegistros: number;
  enviados: number;
  ultimoRegistro: Date | null;
  ultimoEnvio: Date | null;
  diasDesdeUltimoRegistro: number | null;
  funil: FunilRegistros;
  cobertura: Cobertura | null; // null = turma sem calendário
  totalCapacidades: number;
};

export type SemanaRegistros = {
  inicio: Date; // segunda-feira (UTC) da semana
  rotulo: string; // "dd/mm"
  total: number;
};

export type DashboardData = {
  consolidado: {
    totalTurmas: number;
    turmasComRegistro: number;
    turmasSemRegistro: number;
    totalRegistros: number;
    totalEnviados: number;
    tempoMedioEnvioDias: number | null;
    turmasComCalendario: number;
    aulasSemRegistro: number; // soma das turmas com calendário
    coberturaGeral: number | null; // % de aulas ocorridas com registro
  };
  turmas: TurmaDashboard[];
  registrosPorSemana: SemanaRegistros[];
};

// Data (só o dia, em UTC) de um DateTime.
function diaUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// Segunda-feira (UTC) da semana de uma data.
function segundaDaSemana(d: Date): Date {
  const dia = diaUTC(d);
  const dow = (dia.getUTCDay() + 6) % 7; // 0 = segunda
  return new Date(dia.getTime() - dow * MS_DIA);
}

export async function obterDashboardCoordenacao(): Promise<DashboardData> {
  type Linha = {
    id: string;
    nome: string;
    datasAula: string[] | null;
    curso: { nome: string };
    professor: { nome: string };
    capacidades: { count: number }[];
    registros: {
      data: string;
      status: string;
      enviadoEm: string | null;
      analises: { tipo: string }[];
    }[];
  };
  const linhas = exigir<Linha[]>(
    await db()
      .from("turmas")
      .select(
        "id, nome, datasAula:datas_aula, curso:cursos(nome), professor:profiles(nome), " +
          "capacidades(count), " +
          "registros(data, status, enviadoEm:enviado_em, analises(tipo))",
      )
      .is("excluido_em", null) // turmas arquivadas pela Coordenação ficam de fora
      .is("registros.excluido_em", null)
      .order("nome"),
  );
  // Cobertura usa as datas como texto (AAAA-MM-DD), antes da conversão.
  const hojeISO = diaISOEmBrasilia();
  const coberturas = new Map(
    linhas.map((t) => [
      t.id,
      t.datasAula?.length ? calcularCobertura(t.datasAula, t.registros, hojeISO) : null,
    ]),
  );

  // Datas chegam como texto: converte para Date.
  const turmas = linhas.map((t) => ({
    ...t,
    registros: t.registros.map((r) => ({
      ...r,
      data: lerDia(r.data),
      enviadoEm: lerInstante(r.enviadoEm),
    })),
  }));

  const hoje = diaUTC(new Date());
  const temposEnvio: number[] = [];
  const contagemSemana = new Map<number, number>(); // ts da segunda -> total

  const turmasDash: TurmaDashboard[] = turmas.map((t) => {
    const funil: FunilRegistros = { sem: 0, gerada: 0, validada: 0, enviada: 0 };
    let ultimoRegistro: Date | null = null;
    let ultimoEnvio: Date | null = null;

    for (const r of t.registros) {
      // funil
      if (r.status === "ENVIADO") funil.enviada++;
      else if (r.analises.some((a) => a.tipo === "VALIDADA")) funil.validada++;
      else if (r.analises.length > 0) funil.gerada++;
      else funil.sem++;

      // último registro
      if (!ultimoRegistro || r.data > ultimoRegistro) ultimoRegistro = r.data;

      // envio: tempo e último
      if (r.status === "ENVIADO" && r.enviadoEm) {
        if (!ultimoEnvio || r.enviadoEm > ultimoEnvio) ultimoEnvio = r.enviadoEm;
        const dias = Math.round(
          (diaUTC(r.enviadoEm).getTime() - diaUTC(r.data).getTime()) / MS_DIA,
        );
        if (dias >= 0) temposEnvio.push(dias);
      }

      // registros por semana
      const seg = segundaDaSemana(r.data).getTime();
      contagemSemana.set(seg, (contagemSemana.get(seg) ?? 0) + 1);
    }

    const diasDesdeUltimoRegistro = ultimoRegistro
      ? Math.round((hoje.getTime() - diaUTC(ultimoRegistro).getTime()) / MS_DIA)
      : null;

    return {
      id: t.id,
      nome: t.nome,
      cursoNome: t.curso.nome,
      professorNome: t.professor.nome,
      totalRegistros: t.registros.length,
      enviados: funil.enviada,
      ultimoRegistro,
      ultimoEnvio,
      diasDesdeUltimoRegistro,
      funil,
      cobertura: coberturas.get(t.id) ?? null,
      totalCapacidades: t.capacidades[0]?.count ?? 0,
    };
  });

  // Série das últimas 8 semanas (inclui a atual), mesmo as zeradas.
  const segHoje = segundaDaSemana(hoje);
  const registrosPorSemana: SemanaRegistros[] = [];
  for (let i = 7; i >= 0; i--) {
    const inicio = new Date(segHoje.getTime() - i * 7 * MS_DIA);
    registrosPorSemana.push({
      inicio,
      rotulo: new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        timeZone: "UTC",
      }).format(inicio),
      total: contagemSemana.get(inicio.getTime()) ?? 0,
    });
  }

  const totalRegistros = turmasDash.reduce((s, t) => s + t.totalRegistros, 0);
  const totalEnviados = turmasDash.reduce((s, t) => s + t.enviados, 0);
  const tempoMedioEnvioDias =
    temposEnvio.length > 0
      ? Math.round(
          (temposEnvio.reduce((a, b) => a + b, 0) / temposEnvio.length) * 10,
        ) / 10
      : null;

  return {
    consolidado: {
      totalTurmas: turmasDash.length,
      turmasComRegistro: turmasDash.filter((t) => t.totalRegistros > 0).length,
      turmasSemRegistro: turmasDash.filter((t) => t.totalRegistros === 0).length,
      totalRegistros,
      totalEnviados,
      tempoMedioEnvioDias,
      ...consolidarCobertura(turmasDash),
    },
    turmas: turmasDash,
    registrosPorSemana,
  };
}

function consolidarCobertura(turmas: TurmaDashboard[]) {
  const com = turmas.flatMap((t) => (t.cobertura ? [t.cobertura] : []));
  const ocorridas = com.reduce((s, c) => s + c.ocorridas, 0);
  const registradas = com.reduce((s, c) => s + c.registradas, 0);
  return {
    turmasComCalendario: com.length,
    aulasSemRegistro: com.reduce((s, c) => s + c.semRegistro.length, 0),
    coberturaGeral: ocorridas ? Math.round((registradas / ocorridas) * 100) : null,
  };
}

// ─── Painel único (Dashboard) ───────────────────────────────────────────────

export const DIAS_PARADA = 14; // dias corridos sem registro → turma parada

export type TurmaAlerta = { id: string; nome: string; detalhe: string };

export type PainelExtras = {
  alertas: {
    aulasSemRegistro: TurmaAlerta[];
    paradas: TurmaAlerta[];
    semCalendario: TurmaAlerta[];
    semCapacidades: TurmaAlerta[];
  };
  ultimosEnvios: {
    id: string;
    turmaId: string;
    turmaNome: string;
    professorNome: string;
    data: Date;
    tema: string | null;
    enviadoEm: Date | null;
  }[];
  pontosFrequentes: { texto: string; n: number; turmas: number }[];
  acessos: { ativos: number; trocarSenha: number; desativados: number; coordenacao: number };
  excluidos: { turmas: number; registros: number };
};

const MAX_ENVIOS = 8;
const MAX_PONTOS = 6;

function alertas(turmas: TurmaDashboard[]): PainelExtras["alertas"] {
  const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
  return {
    aulasSemRegistro: turmas
      .filter((t) => (t.cobertura?.semRegistro.length ?? 0) > 0)
      .sort((a, b) => b.cobertura!.semRegistro.length - a.cobertura!.semRegistro.length)
      .map((t) => ({
        id: t.id,
        nome: t.nome,
        detalhe: plural(t.cobertura!.semRegistro.length, "aula sem registro", "aulas sem registro"),
      })),
    paradas: turmas
      .filter((t) => t.diasDesdeUltimoRegistro != null && t.diasDesdeUltimoRegistro > DIAS_PARADA)
      .map((t) => ({ id: t.id, nome: t.nome, detalhe: `último registro há ${t.diasDesdeUltimoRegistro} dias` })),
    semCalendario: turmas
      .filter((t) => !t.cobertura)
      .map((t) => ({ id: t.id, nome: t.nome, detalhe: t.professorNome })),
    semCapacidades: turmas
      .filter((t) => t.totalCapacidades === 0)
      .map((t) => ({ id: t.id, nome: t.nome, detalhe: "a IA não analisa sem capacidades" })),
  };
}

// Agrupa textos iguais (sem diferenciar maiúsculas/espaços) e conta.
function maisFrequentes(itens: { texto: string; turmaId: string }[]) {
  const mapa = new Map<string, { texto: string; n: number; turmas: Set<string> }>();
  for (const { texto, turmaId } of itens) {
    const chave = texto.trim().toLowerCase().replace(/\s+/g, " ");
    if (!chave) continue;
    const atual = mapa.get(chave) ?? { texto: texto.trim(), n: 0, turmas: new Set<string>() };
    atual.n++;
    atual.turmas.add(turmaId);
    mapa.set(chave, atual);
  }
  return [...mapa.values()]
    .sort((a, b) => b.n - a.n || b.turmas.size - a.turmas.size)
    .slice(0, MAX_PONTOS)
    .map((p) => ({ texto: p.texto, n: p.n, turmas: p.turmas.size }));
}

export async function obterPainelCoordenacao(): Promise<DashboardData & PainelExtras> {
  type LinhaEnvio = {
    id: string;
    data: string;
    tema: string | null;
    enviadoEm: string | null;
    turma: { id: string; nome: string; professor: { nome: string } };
    analises: { versao: number; pontosAtencao: string[] }[];
  };

  const [base, envios, usuarios, turmasExcluidas, registrosExcluidos] = await Promise.all([
    obterDashboardCoordenacao(),
    // Registros enviados (turma ativa) com a última análise VALIDADA de cada um.
    db()
      .from("registros")
      .select(
        "id, data, tema, enviadoEm:enviado_em, " +
          "turma:turmas!inner(id, nome, professor:profiles(nome)), " +
          "analises(versao, pontosAtencao:pontos_atencao)",
      )
      .eq("status", "ENVIADO")
      .is("excluido_em", null)
      .is("turma.excluido_em", null)
      .eq("analises.tipo", "VALIDADA")
      .order("enviado_em", { ascending: false })
      .order("versao", { referencedTable: "analises", ascending: false })
      .limit(1, { referencedTable: "analises" }),
    listarUsuarios(),
    db().from("turmas").select("id", { count: "exact", head: true }).not("excluido_em", "is", null),
    // Excluídos um a um (os que saíram junto com a turma contam na turma).
    db()
      .from("registros")
      .select("id, turma:turmas!inner(id)", { count: "exact", head: true })
      .not("excluido_em", "is", null)
      .is("turma.excluido_em", null),
  ]);

  const linhasEnvio = exigir<LinhaEnvio[]>(envios);
  const professores = usuarios.filter((u) => u.role === "PROFESSOR");

  return {
    ...base,
    alertas: alertas(base.turmas),
    ultimosEnvios: linhasEnvio.slice(0, MAX_ENVIOS).map((r) => ({
      id: r.id,
      turmaId: r.turma.id,
      turmaNome: r.turma.nome,
      professorNome: r.turma.professor.nome,
      data: lerDia(r.data),
      tema: r.tema,
      enviadoEm: lerInstante(r.enviadoEm),
    })),
    pontosFrequentes: maisFrequentes(
      linhasEnvio.flatMap((r) =>
        (r.analises[0]?.pontosAtencao ?? []).map((texto) => ({ texto, turmaId: r.turma.id })),
      ),
    ),
    acessos: {
      ativos: professores.filter((u) => u.situacao === "ATIVO").length,
      trocarSenha: professores.filter((u) => u.situacao === "TROCAR_SENHA").length,
      desativados: professores.filter((u) => u.situacao === "DESATIVADO").length,
      coordenacao: usuarios.filter((u) => u.role === "COORDENACAO" && u.situacao !== "DESATIVADO").length,
    },
    excluidos: {
      turmas: turmasExcluidas.count ?? 0,
      registros: registrosExcluidos.count ?? 0,
    },
  };
}
