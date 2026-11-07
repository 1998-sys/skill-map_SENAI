"use client";

import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import {
  NOMES_DIAS,
  diaDaSemana,
  feriado,
  gerarDatasAula,
  horasTotais,
  mesesDoPeriodo,
  rotuloCurto,
  semanasDoMes,
  type DiaISO,
} from "@/lib/calendario";

// Editor do calendário da turma: 4 campos (início, término, dias de aula,
// horas por dia) → o sistema marca as datas de aula (sem feriados nacionais)
// e o professor clica nos dias para ajustar. Não salva sozinho: grava campos
// ocultos (cal_*) dentro do <form> de quem usa o componente.

export type CalendarioInicial = {
  inicio: DiaISO | null;
  fim: DiaISO | null;
  diasSemana: number[] | null;
  horasPorDia: number | null;
  datasAula: DiaISO[] | null;
};

const ORDEM_DIAS = [1, 2, 3, 4, 5, 6, 0]; // Seg … Sáb, Dom
const campo =
  "h-10 w-full rounded-md border border-input bg-card px-3 text-[15px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25";

export function CalendarioTurma({
  inicial,
  cargaHoraria,
}: {
  inicial?: CalendarioInicial;
  cargaHoraria?: number | null;
}) {
  const [inicio, setInicio] = useState(inicial?.inicio ?? "");
  const [fim, setFim] = useState(inicial?.fim ?? "");
  const [dias, setDias] = useState<number[]>(inicial?.diasSemana ?? []);
  const [horas, setHoras] = useState(inicial?.horasPorDia ? String(inicial.horasPorDia) : "");
  const [datas, setDatas] = useState<Set<DiaISO>>(new Set(inicial?.datasAula ?? []));
  const [ajustado, setAjustado] = useState(false);

  // Mudou início, término ou dias → refaz as datas a partir da regra.
  function aplicarRegra(novoInicio: string, novoFim: string, novosDias: number[]) {
    setDatas(new Set(gerarDatasAula({ inicio: novoInicio, fim: novoFim, diasSemana: novosDias })));
    setAjustado(false);
  }

  function alternarDiaSemana(d: number) {
    const novos = dias.includes(d) ? dias.filter((x) => x !== d) : [...dias, d];
    setDias(novos);
    aplicarRegra(inicio, fim, novos);
  }

  function alternarData(d: DiaISO) {
    setDatas((atual) => {
      const nova = new Set(atual);
      if (nova.has(d)) nova.delete(d);
      else nova.add(d);
      return nova;
    });
    setAjustado(true);
  }

  const periodoValido = Boolean(inicio && fim && inicio <= fim);
  const meses = useMemo(() => mesesDoPeriodo(inicio, fim), [inicio, fim]);
  const ordenadas = [...datas].filter((d) => d >= inicio && d <= fim).sort();
  const horasDia = Number(horas.replace(",", ".")) || null;
  const total = horasTotais(ordenadas.length, horasDia);

  // Feriados que caíram em dia de aula (e por isso ficaram de fora).
  const feriadosDescontados = useMemo(() => {
    if (!periodoValido || dias.length === 0) return [];
    const lista: { d: DiaISO; nome: string }[] = [];
    for (const m of meses)
      for (const semana of semanasDoMes(m.ano, m.mes0))
        for (const d of semana) {
          if (!d || d < inicio || d > fim) continue;
          const nome = feriado(d);
          if (nome && dias.includes(diaDaSemana(d))) lista.push({ d, nome });
        }
    return lista;
  }, [meses, inicio, fim, dias, periodoValido]);

  return (
    <div className="space-y-4">
      {/* Campos que vão para o servidor junto com o formulário */}
      <input type="hidden" name="cal_inicio" value={periodoValido ? inicio : ""} />
      <input type="hidden" name="cal_fim" value={periodoValido ? fim : ""} />
      <input type="hidden" name="cal_dias" value={dias.join(",")} />
      <input type="hidden" name="cal_horas" value={horasDia ?? ""} />
      <input type="hidden" name="cal_datas" value={ordenadas.join(",")} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_2fr_0.8fr]">
        <div className="space-y-1.5">
          <label htmlFor="cal-inicio" className="text-sm font-semibold">Início</label>
          <input
            id="cal-inicio"
            type="date"
            value={inicio}
            className={campo}
            onChange={(e) => {
              setInicio(e.target.value);
              aplicarRegra(e.target.value, fim, dias);
            }}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="cal-fim" className="text-sm font-semibold">Término</label>
          <input
            id="cal-fim"
            type="date"
            value={fim}
            min={inicio || undefined}
            className={campo}
            onChange={(e) => {
              setFim(e.target.value);
              aplicarRegra(inicio, e.target.value, dias);
            }}
          />
        </div>
        <fieldset className="space-y-1.5">
          <legend className="mb-1.5 text-sm font-semibold">Dias de aula</legend>
          <div className="flex flex-wrap gap-1.5">
            {ORDEM_DIAS.map((d) => {
              const ativo = dias.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => alternarDiaSemana(d)}
                  className={`h-10 min-w-12 rounded-md border px-2 text-sm font-semibold transition-colors ${
                    ativo
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  {NOMES_DIAS[d]}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="space-y-1.5">
          <label htmlFor="cal-horas" className="text-sm font-semibold">Horas por dia</label>
          <input
            id="cal-horas"
            type="number"
            min="0.5"
            max="24"
            step="0.5"
            inputMode="decimal"
            value={horas}
            placeholder="Ex.: 4"
            className={campo}
            onChange={(e) => setHoras(e.target.value)}
          />
        </div>
      </div>

      {inicio && fim && inicio > fim && (
        <p role="alert" className="text-sm text-destructive">
          O término precisa ser depois do início.
        </p>
      )}

      {periodoValido && dias.length > 0 && (
        <>
          {/* Resumo */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-muted px-4 py-3 text-sm">
            <span className="flex items-center gap-2 font-semibold text-title">
              <CalendarDays className="size-4" />
              {ordenadas.length} {ordenadas.length === 1 ? "aula" : "aulas"}
              {total != null && ` · ${total} h`}
            </span>
            {total != null && cargaHoraria ? (
              total === cargaHoraria ? (
                <span className="font-medium text-success">Bate com a carga horária ({cargaHoraria} h).</span>
              ) : (
                <span className="font-medium text-warning">
                  O calendário soma {total} h, mas a carga horária é {cargaHoraria} h.
                </span>
              )
            ) : null}
            {ajustado && (
              <span className="text-xs text-muted-foreground">
                Ajustado à mão. Se mudar início, término ou dias, o calendário é refeito.
              </span>
            )}
          </div>

          {feriadosDescontados.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Feriados nacionais descontados:{" "}
              {feriadosDescontados.map((f) => `${rotuloCurto(f.d)} ${f.nome}`).join(" · ")}
            </p>
          )}

          {/* Meses */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {meses.map((m) => (
              <div key={`${m.ano}-${m.mes0}`} className="rounded-lg border bg-card p-3">
                <p className="mb-2 text-center text-sm font-semibold capitalize">{m.rotulo}</p>
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {["D", "S", "T", "Q", "Q", "S", "S"].map((l, i) => (
                    <span key={i} className="py-1 font-semibold text-muted-foreground">
                      {l}
                    </span>
                  ))}
                  {semanasDoMes(m.ano, m.mes0).flat().map((d, i) => {
                    if (!d) return <span key={i} />;
                    const dentro = d >= inicio && d <= fim;
                    const aula = dentro && datas.has(d);
                    const nomeFeriado = feriado(d);
                    const titulo = `${rotuloCurto(d)}${nomeFeriado ? ` · ${nomeFeriado}` : ""}${
                      aula ? " · aula (clique para tirar)" : dentro ? " · sem aula (clique para incluir)" : ""
                    }`;
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={!dentro}
                        aria-pressed={aula}
                        title={titulo}
                        aria-label={titulo}
                        onClick={() => alternarData(d)}
                        className={`h-8 rounded text-[13px] tabular-nums transition-colors ${
                          aula
                            ? "bg-primary font-semibold text-primary-foreground hover:bg-primary-hover"
                            : nomeFeriado && dentro
                              ? "bg-surface-strong text-muted-foreground line-through hover:bg-muted"
                              : dentro
                                ? "text-foreground hover:bg-muted"
                                : "text-muted-foreground/40"
                        }`}
                      >
                        {Number(d.slice(8))}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-sm bg-primary" /> Aula
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-sm bg-surface-strong" /> Feriado nacional
            </span>
            <span>Clique em um dia para incluir ou tirar a aula (emenda, feriado municipal, reposição).</span>
          </div>
        </>
      )}
    </div>
  );
}
