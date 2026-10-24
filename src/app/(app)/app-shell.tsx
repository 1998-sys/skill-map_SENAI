"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";

type Role = "PROFESSOR" | "COORDENACAO";

const ROLE_LABEL: Record<Role, string> = {
  PROFESSOR: "Professor",
  COORDENACAO: "Coordenação",
};

function IconUsers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconHome() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}
function IconClipboard() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="8" y="2" width="8" height="4" rx="1" /><path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" /><path d="M9 12h6M9 16h6" />
    </svg>
  );
}

const NAV: { href: string; label: string; Icon: () => React.ReactElement; role?: Role }[] = [
  { href: "/dashboard", label: "Início", Icon: IconHome },
  { href: "/turmas", label: "Turmas", Icon: IconUsers },
  { href: "/coordenacao", label: "Coordenação", Icon: IconClipboard, role: "COORDENACAO" },
];

export function AppShell({
  role,
  nome,
  children,
}: {
  role: Role;
  nome: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = NAV.filter((i) => !i.role || i.role === role);
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
  const atual = items.find((i) => isActive(i.href));

  return (
    <div className="flex min-h-screen">
      {open && (
        <button
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      <aside
        className={`${open ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-40 flex w-60 shrink-0 transform flex-col gap-8 p-4 transition-transform md:static md:translate-x-0`}
        style={{ background: "linear-gradient(180deg,#153763,#0b1d3a)" }}
      >
        <div className="px-2 pt-1 leading-none">
          <div className="text-[26px] font-extrabold italic tracking-wide text-white">SENAI</div>
          <div className="text-[22px] font-bold text-[#5aa6ef]">SkillMap</div>
        </div>
        <nav className="flex flex-col gap-1.5 text-sm">
          {items.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-[#cdd8ea] hover:bg-white/10"
                }`}
              >
                <Icon />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              aria-label="Abrir menu"
              onClick={() => setOpen(true)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted md:hidden"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex items-center gap-2.5 text-[15px] sm:text-[17px]">
              <span className="font-semibold text-foreground">SENAI SkillMap</span>
              <span className="text-border">|</span>
              <span className="text-muted-foreground">{atual?.label ?? "SkillMap"}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {nome} · {ROLE_LABEL[role]}
            </span>
            <form action="/auth/signout" method="post">
              <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Sair
              </button>
            </form>
          </div>
        </header>

        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
