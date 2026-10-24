// Pílula de status de registro, no padrão SENAI.
// ENVIADO = vermelho claro ("enviado à Coordenação"); RASCUNHO = verde.

type RegistroStatus = "RASCUNHO" | "ENVIADO";

export function StatusBadge({
  status,
  short = false,
}: {
  status: RegistroStatus;
  short?: boolean;
}) {
  const enviado = status === "ENVIADO";
  const label = enviado
    ? short
      ? "Enviado"
      : "Enviado à Coordenação"
    : "Rascunho";

  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        enviado
          ? "bg-brand-soft text-primary-active"
          : "bg-success-soft text-success"
      }`}
    >
      {label}
    </span>
  );
}
