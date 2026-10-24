// Pílula de status de registro, no padrão SENAI.
// RASCUNHO = verde ("salvo"); ENVIADO = azul ("enviado à Coordenação").

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
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        enviado
          ? "bg-[#e4edfb] text-[#2563eb]"
          : "bg-[#e7f6ec] text-[#2e9e54]"
      }`}
    >
      {label}
    </span>
  );
}
