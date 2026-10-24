import type { ReactNode } from "react";

// Card de métrica (ícone em círculo colorido + rótulo + valor), padrão SENAI.
// Usado no Painel da Coordenação.

type StatColor = "blue" | "orange" | "green";

const COLORS: Record<StatColor, string> = {
  blue: "bg-[#e8f0fd] text-[#2563eb]",
  orange: "bg-[#fde9e1] text-[#e8762c]",
  green: "bg-[#e7f6ec] text-[#2e9e54]",
};

export function StatCard({
  icon,
  label,
  value,
  color = "blue",
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  color?: StatColor;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-xl border bg-card p-4">
      <div
        className={`flex size-11 shrink-0 items-center justify-center rounded-full ${COLORS[color]}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm leading-tight text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
      </div>
    </div>
  );
}
