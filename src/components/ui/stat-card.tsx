import type { ReactNode } from "react";

// Card de métrica (ícone em círculo colorido + rótulo + valor), padrão SENAI:
// tile branco com filete vermelho à esquerda. Usado no Painel da Coordenação.

type StatColor = "brand" | "neutral" | "warning" | "success";

const COLORS: Record<StatColor, string> = {
  brand: "bg-brand-soft text-primary-hover",
  neutral: "bg-muted text-foreground",
  warning: "bg-warning-soft text-warning",
  success: "bg-success-soft text-success",
};

export function StatCard({
  icon,
  label,
  value,
  color = "brand",
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  color?: StatColor;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-md border border-l-[5px] border-l-primary bg-card p-4">
      <div
        className={`flex size-11 shrink-0 items-center justify-center rounded-full ${COLORS[color]}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm leading-tight text-muted-foreground">{label}</div>
        <div className="text-2xl font-extrabold text-title">{value}</div>
      </div>
    </div>
  );
}
