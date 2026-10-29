import { prisma } from "@/lib/prisma";

// Dashboard de acompanhamento da Coordenação (onda 1): só com os dados que já
// existem (Registro + Analise). Os indicadores de cobertura (aulas previstas/
// ocorridas, taxa de preenchimento) dependem do calendário da turma — onda 2.
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
  const turmas = await prisma.turma.findMany({
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      curso: { select: { nome: true } },
      professor: { select: { nome: true } },
      registros: {
        select: {
          data: true,
          status: true,
          enviadoEm: true,
          analises: { select: { tipo: true } },
        },
      },
    },
  });

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
    },
    turmas: turmasDash,
    registrosPorSemana,
  };
}
