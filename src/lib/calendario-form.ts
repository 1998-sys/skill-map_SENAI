import { ehDiaValido, type DiaISO } from "@/lib/calendario";

// Lê e valida os campos ocultos do editor de calendário (cal_*) e devolve as
// colunas da tabela `turmas`. O calendário é OBRIGATÓRIO ao criar e ao salvar
// uma turma: início, término, pelo menos um dia de aula e horas por dia.
// (Turmas antigas, criadas antes, podem continuar sem calendário até alguém
// salvá-lo na tela da turma.)

export type ColunasCalendario = {
  data_inicio: DiaISO | null;
  data_fim: DiaISO | null;
  dias_semana: number[] | null;
  horas_por_dia: number | null;
  datas_aula: DiaISO[] | null;
};

export function lerCalendario(
  formData: FormData,
): { ok: true; colunas: ColunasCalendario } | { ok: false; error: string } {
  const texto = (k: string) => String(formData.get(k) ?? "").trim();
  const inicio = texto("cal_inicio");
  const fim = texto("cal_fim");

  if (!inicio && !fim) {
    return { ok: false, error: "Calendário: informe o início e o término das aulas." };
  }
  if (!ehDiaValido(inicio) || !ehDiaValido(fim)) {
    return { ok: false, error: "Calendário: informe início e término válidos." };
  }
  if (inicio > fim) {
    return { ok: false, error: "Calendário: o término precisa ser depois do início." };
  }

  const dias = [...new Set(
    texto("cal_dias").split(",").filter(Boolean).map(Number),
  )].filter((d) => Number.isInteger(d) && d >= 0 && d <= 6).sort();
  if (dias.length === 0) {
    return { ok: false, error: "Calendário: marque pelo menos um dia de aula." };
  }

  const horasTexto = texto("cal_horas");
  if (!horasTexto) {
    return { ok: false, error: "Calendário: informe as horas de aula por dia." };
  }
  const horas = Number(horasTexto);
  if (!Number.isFinite(horas) || horas <= 0 || horas > 24) {
    return { ok: false, error: "Calendário: horas por dia deve ser entre 0,5 e 24." };
  }

  const datas = [...new Set(texto("cal_datas").split(",").filter(Boolean))].sort();
  if (datas.length === 0) {
    return { ok: false, error: "Calendário: nenhuma aula no período escolhido." };
  }
  if (datas.length > 800 || datas.some((d) => !ehDiaValido(d) || d < inicio || d > fim)) {
    return { ok: false, error: "Calendário: há datas de aula inválidas." };
  }

  return {
    ok: true,
    colunas: {
      data_inicio: inicio,
      data_fim: fim,
      dias_semana: dias,
      horas_por_dia: horas,
      datas_aula: datas,
    },
  };
}
