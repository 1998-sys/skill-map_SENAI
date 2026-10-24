"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartColumn, FileText, History, Users } from "lucide-react";
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

// Subtítulo da topbar para as telas internas da turma (padrão das referências).
function subtituloDaRota(pathname: string): string | null {
  if (pathname === "/turmas/nova") return "Nova turma";
  if (/^\/turmas\/[^/]+\/historico/.test(pathname)) return "Histórico da Turma";
  if (/^\/turmas\/[^/]+\/analise/.test(pathname)) return "Análises da Turma";
  if (/^\/turmas\/[^/]+\/registros\/[^/]+\/analise/.test(pathname)) return "Análise da IA";
  if (/^\/turmas\/[^/]+\/registros\/[^/]+/.test(pathname)) return "Registro Diário";
  if (/^\/turmas\/[^/]+$/.test(pathname)) return "Turma / Curso";
  return null;
}

type SubItem = { href: string; label: string; Icon: typeof FileText; ativo: boolean };

// Submenu da turma aberta (spec: Turma / Curso, Registro Diário, Análise da IA,
// Histórico da Turma). Dentro de um registro, os atalhos apontam para ele.
function submenuDaTurma(pathname: string): SubItem[] | null {
  const m = pathname.match(/^\/turmas\/([^/]+)(?:\/registros\/([^/]+))?/);
  if (!m || m[1] === "nova") return null;
  const base = `/turmas/${m[1]}`;
  const registro = m[2] && m[2] !== "novo" ? `${base}/registros/${m[2]}` : null;
  const naAnalise = /\/analise$/.test(pathname);
  return [
    { href: base, label: "Turma / Curso", Icon: Users, ativo: pathname === base },
    {
      href: registro ?? `${base}/registros/novo`,
      label: "Registro Diário",
      Icon: FileText,
      ativo: pathname.startsWith(`${base}/registros/`) && !naAnalise,
    },
    {
      href: registro ? `${registro}/analise` : `${base}/analise`,
      label: "Análise da IA",
      Icon: ChartColumn,
      ativo: naAnalise,
    },
    {
      href: `${base}/historico`,
      label: "Histórico da Turma",
      Icon: History,
      ativo: pathname.startsWith(`${base}/historico`),
    },
  ];
}

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
  const subtitulo = subtituloDaRota(pathname) ?? atual?.label ?? "SkillMap";
  const submenu = submenuDaTurma(pathname);

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
        className={`${open ? "translate-x-0" : "-translate-x-full max-md:invisible"} fixed inset-y-0 left-0 z-40 flex w-60 shrink-0 transform flex-col gap-8 border-r border-sidebar-border bg-sidebar px-3.5 py-5 transition-[transform,visibility] md:static md:translate-x-0`}
      >
        <Link
          href="/dashboard"
          onClick={() => setOpen(false)}
          className="flex flex-col items-start gap-2 border-b border-sidebar-border px-1.5 pb-5"
          aria-label="SENAI SkillMap — Início"
        >
          <Image src="/brand/senai.svg" alt="SENAI" width={150} height={50} priority />
          <span className="text-[28px] leading-none font-extrabold tracking-tight text-title">
            SkillMap
          </span>
        </Link>
        <nav aria-label="Menu principal" className="flex flex-col gap-1 text-sm">
          {items.map(({ href, label, Icon }) => {
            const active = isActive(href);
            // Com o submenu aberto, o destaque fica no item da turma, não em "Turmas".
            const temSub = href === "/turmas" && submenu;
            return (
              <div key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={active && !temSub ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-md border-l-4 px-3.5 py-2.5 font-semibold transition-colors ${
                    active && !temSub
                      ? "border-primary bg-sidebar-accent text-sidebar-accent-foreground"
                      : active
                        ? "border-transparent text-title hover:bg-muted"
                        : "border-transparent text-sidebar-foreground hover:bg-muted hover:text-title"
                  }`}
                >
                  <Icon />
                  {label}
                </Link>
                {temSub && (
                  <ul
                    aria-label="Turma aberta"
                    className="mt-1 ml-5 flex flex-col gap-0.5 border-l border-sidebar-border pl-2"
                  >
                    {submenu.map((s) => (
                      <li key={s.label}>
                        <Link
                          href={s.href}
                          onClick={() => setOpen(false)}
                          aria-current={s.ativo ? "page" : undefined}
                          className={`flex items-center gap-2.5 rounded-md border-l-[3px] px-2.5 py-2 text-[13px] transition-colors ${
                            s.ativo
                              ? "border-primary bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                              : "border-transparent font-medium text-muted-foreground hover:bg-muted hover:text-title"
                          }`}
                        >
                          <s.Icon className="size-4 shrink-0" aria-hidden="true" />
                          {s.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b-[3px] border-primary bg-card px-4 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              aria-label="Abrir menu"
              onClick={() => setOpen(true)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted md:hidden"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex min-w-0 items-center gap-2.5 text-[15px] sm:text-[17px]">
              <span className="font-extrabold whitespace-nowrap text-title">SENAI SkillMap</span>
              <span className="text-border" aria-hidden="true">|</span>
              <span className="truncate font-medium text-muted-foreground">{subtitulo}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {nome} · {ROLE_LABEL[role]}
            </span>
            <form action="/auth/signout" method="post">
              <button type="submit" className={buttonVariants({ variant: "outline-primary", size: "sm" })}>
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
