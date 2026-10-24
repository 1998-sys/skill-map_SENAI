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

// Situação da análise de um registro (lista "Análises da Turma"):
// gerada = versão da IA ainda não revisada; validada = revisada pelo professor,
// ainda não enviada; enviada = registro enviado à Coordenação.
export type SituacaoAnalise = "gerada" | "validada" | "enviada";

export const SITUACAO_LABEL: Record<SituacaoAnalise, string> = {
  gerada: "Gerada pela IA",
  validada: "Validada pelo professor",
  enviada: "Enviada à Coordenação",
};

const SITUACAO_COR: Record<SituacaoAnalise, string> = {
  gerada: "bg-warning-soft text-warning",
  validada: "bg-success-soft text-success",
  enviada: "bg-brand-soft text-primary-active",
};

export function SituacaoBadge({ situacao }: { situacao: SituacaoAnalise }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${SITUACAO_COR[situacao]}`}
    >
      {SITUACAO_LABEL[situacao]}
    </span>
  );
}
