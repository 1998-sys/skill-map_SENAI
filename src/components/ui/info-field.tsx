import type { ReactNode } from "react";
import { Info } from "lucide-react";

// Campo somente leitura (rótulo + caixa cinza), padrão SENAI.
export function InfoField({
  label,
  value,
  className = "",
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 space-y-1.5 ${className}`}>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="rounded-lg bg-muted break-words px-3.5 py-2.5 text-[15px] text-foreground">
        {value || "—"}
      </div>
    </div>
  );
}

// Nota explicativa no rodapé da página (ícone "i" + texto de apoio).
export function PageNote({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-sm text-muted-foreground">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
