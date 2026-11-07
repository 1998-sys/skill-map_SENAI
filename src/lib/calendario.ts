// Calendário da turma (Dashboard, onda 2) — lógica pura, usada na tela e no
// servidor. Datas trabalham como texto "AAAA-MM-DD" (coluna `date` do banco),
// sem fuso, para não "voltar um dia".

export type DiaISO = string; // "AAAA-MM-DD"

export type RegraCalendario = {
  inicio: DiaISO;
  fim: DiaISO;
  diasSemana: number[]; // 0 = domingo … 6 = sábado
};

export const NOMES_DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;
const NOMES_MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

// Limite de segurança: uma turma de até ~2 anos.
const MAXIMO_DE_DIAS = 800;

const doisDigitos = (n: number) => String(n).padStart(2, "0");

export function montarDia(ano: number, mes0: number, dia: number): DiaISO {
  return `${ano}-${doisDigitos(mes0 + 1)}-${doisDigitos(dia)}`;
}

function paraData(d: DiaISO): Date {
  const [a, m, dia] = d.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, dia));
}

function deData(d: Date): DiaISO {
  return montarDia(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function ehDiaValido(d: unknown): d is DiaISO {
  return (
    typeof d === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(d) &&
    deData(paraData(d)) === d // rejeita 31/02 etc.
  );
}

export function somarDias(d: DiaISO, n: number): DiaISO {
  const data = paraData(d);
  data.setUTCDate(data.getUTCDate() + n);
  return deData(data);
}

export function diaDaSemana(d: DiaISO): number {
  return paraData(d).getUTCDay();
}

/** "2027-04-10" → "10/04" */
export function rotuloCurto(d: DiaISO): string {
  return `${d.slice(8, 10)}/${d.slice(5, 7)}`;
}

// ─── Feriados nacionais ─────────────────────────────────────────────────────

// Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher).
function pascoa(ano: number): DiaISO {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return montarDia(ano, mes - 1, dia);
}

const cacheFeriados = new Map<number, Map<DiaISO, string>>();

export function feriadosNacionais(ano: number): Map<DiaISO, string> {
  const pronto = cacheFeriados.get(ano);
  if (pronto) return pronto;
  const p = pascoa(ano);
  const lista: [DiaISO, string][] = [
    [montarDia(ano, 0, 1), "Confraternização Universal"],
    [somarDias(p, -48), "Carnaval"],
    [somarDias(p, -47), "Carnaval"],
    [somarDias(p, -2), "Sexta-feira Santa"],
    [montarDia(ano, 3, 21), "Tiradentes"],
    [montarDia(ano, 4, 1), "Dia do Trabalho"],
    [somarDias(p, 60), "Corpus Christi"],
    [montarDia(ano, 8, 7), "Independência"],
    [montarDia(ano, 9, 12), "Nossa Senhora Aparecida"],
    [montarDia(ano, 10, 2), "Finados"],
    [montarDia(ano, 10, 15), "Proclamação da República"],
    [montarDia(ano, 10, 20), "Consciência Negra"],
    [montarDia(ano, 11, 25), "Natal"],
  ];
  const mapa = new Map(lista);
  cacheFeriados.set(ano, mapa);
  return mapa;
}

/** Nome do feriado nacional no dia, ou null. */
export function feriado(d: DiaISO): string | null {
  return feriadosNacionais(Number(d.slice(0, 4))).get(d) ?? null;
}

// ─── Geração das datas de aula ──────────────────────────────────────────────

/** Dias da semana escolhidos, entre início e término, sem feriados nacionais. */
export function gerarDatasAula(regra: RegraCalendario): DiaISO[] {
  const { inicio, fim, diasSemana } = regra;
  if (!ehDiaValido(inicio) || !ehDiaValido(fim) || inicio > fim) return [];
  const datas: DiaISO[] = [];
  let d = inicio;
  for (let n = 0; d <= fim && n < MAXIMO_DE_DIAS; n++, d = somarDias(d, 1)) {
    if (diasSemana.includes(diaDaSemana(d)) && !feriado(d)) datas.push(d);
  }
  return datas;
}

/** Meses entre início e término, para desenhar o calendário. */
export function mesesDoPeriodo(inicio: DiaISO, fim: DiaISO) {
  if (!ehDiaValido(inicio) || !ehDiaValido(fim) || inicio > fim) return [];
  const meses: { ano: number; mes0: number; rotulo: string }[] = [];
  let ano = Number(inicio.slice(0, 4));
  let mes0 = Number(inicio.slice(5, 7)) - 1;
  const anoFim = Number(fim.slice(0, 4));
  const mesFim = Number(fim.slice(5, 7)) - 1;
  while ((ano < anoFim || (ano === anoFim && mes0 <= mesFim)) && meses.length < 30) {
    meses.push({ ano, mes0, rotulo: `${NOMES_MESES[mes0]}/${ano}` });
    mes0++;
    if (mes0 > 11) {
      mes0 = 0;
      ano++;
    }
  }
  return meses;
}

/** Dias do mês em semanas (domingo a sábado); null = célula vazia. */
export function semanasDoMes(ano: number, mes0: number): (DiaISO | null)[][] {
  const primeiro = montarDia(ano, mes0, 1);
  const diasNoMes = new Date(Date.UTC(ano, mes0 + 1, 0)).getUTCDate();
  const celulas: (DiaISO | null)[] = Array(diaDaSemana(primeiro)).fill(null);
  for (let dia = 1; dia <= diasNoMes; dia++) celulas.push(montarDia(ano, mes0, dia));
  while (celulas.length % 7) celulas.push(null);
  const semanas: (DiaISO | null)[][] = [];
  for (let i = 0; i < celulas.length; i += 7) semanas.push(celulas.slice(i, i + 7));
  return semanas;
}

/** Total de horas, com até 1 casa decimal. */
export function horasTotais(aulas: number, horasPorDia: number | null): number | null {
  if (!horasPorDia || horasPorDia <= 0) return null;
  return Math.round(aulas * horasPorDia * 10) / 10;
}

// ─── Cobertura dos registros ────────────────────────────────────────────────

export type Cobertura = {
  previstas: number; // datas de aula do calendário
  ocorridas: number; // datas de aula até hoje (inclusive)
  registradas: number; // aulas ocorridas que têm registro
  enviadas: number; // aulas ocorridas com registro enviado à Coordenação
  semRegistro: DiaISO[]; // aulas ocorridas sem registro (mais recentes primeiro)
  percentual: number | null; // registradas ÷ ocorridas
};

export function calcularCobertura(
  datasAula: DiaISO[],
  registros: { data: DiaISO; status: string }[],
  hoje: DiaISO,
): Cobertura {
  const comRegistro = new Set(registros.map((r) => r.data));
  const comEnvio = new Set(registros.filter((r) => r.status === "ENVIADO").map((r) => r.data));
  const ocorridas = datasAula.filter((d) => d <= hoje);
  const semRegistro = ocorridas.filter((d) => !comRegistro.has(d)).reverse();
  const registradas = ocorridas.length - semRegistro.length;
  return {
    previstas: datasAula.length,
    ocorridas: ocorridas.length,
    registradas,
    enviadas: ocorridas.filter((d) => comEnvio.has(d)).length,
    semRegistro,
    percentual: ocorridas.length ? Math.round((registradas / ocorridas.length) * 100) : null,
  };
}
