// Formatação de datas usada em toda a interface (pt-BR).
//
// - Data da aula (`Registro.data`) é só dia: salva como meia-noite UTC, então é
//   formatada em UTC para não "voltar um dia".
// - Instantes (ex.: `enviadoEm`) são formatados no fuso de Brasília, de forma
//   explícita — o servidor da Vercel roda em UTC e o local, no fuso da máquina.

const FUSO = "America/Sao_Paulo";

const fmtDia = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });
const fmtInstante = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO,
  dateStyle: "short",
  timeStyle: "short",
});
const fmtDiaInstante = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO });

/** Data da aula (somente dia). Ex.: 24/10/2026 */
export function formatarData(d: Date) {
  return fmtDia.format(d);
}

/** Instante com hora, no horário de Brasília. Ex.: 24/10/2026, 08:44 */
export function formatarDataHora(d: Date) {
  return fmtInstante.format(d);
}

/** Só o dia de um instante, no horário de Brasília. Ex.: 24/10/2026 */
export function formatarDiaDoInstante(d: Date) {
  return fmtDiaInstante.format(d);
}
