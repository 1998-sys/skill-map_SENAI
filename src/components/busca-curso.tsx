"use client";

import { useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { buscarCursos, normalizarBusca, type CursoCatalogo } from "@/lib/catalogo-cursos";

// Campo "Curso" com busca: o professor digita parte do nome (sem se preocupar
// com acento) ou abre a lista pela setinha. Ao escolher um curso do catálogo,
// avisa a tela (onEscolher) para preencher carga horária e capacidades.
// Um nome fora do catálogo também vale: é só digitar.
export function BuscaCurso({
  id,
  name,
  defaultValue = "",
  className,
  onEscolher,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  className?: string;
  onEscolher: (curso: CursoCatalogo) => void;
}) {
  const [texto, setTexto] = useState(defaultValue);
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const listaId = useId();
  const campo = useRef<HTMLInputElement>(null);

  const opcoes = buscarCursos(texto);
  const escolhido = normalizarBusca(texto);

  function escolher(curso: CursoCatalogo) {
    setTexto(curso.nome);
    setAberto(false);
    onEscolher(curso);
  }

  function aoTeclar(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!aberto) {
        setAberto(true);
        setAtivo(0);
        return;
      }
      const passo = e.key === "ArrowDown" ? 1 : -1;
      setAtivo((a) => (opcoes.length ? (a + passo + opcoes.length) % opcoes.length : 0));
    } else if (e.key === "Enter" && aberto && opcoes[ativo]) {
      e.preventDefault(); // não envia o formulário
      escolher(opcoes[ativo]);
    } else if (e.key === "Escape") {
      setAberto(false);
    }
  }

  return (
    <div className="relative">
      <Input
        ref={campo}
        id={id}
        name={name}
        required
        autoComplete="off"
        role="combobox"
        aria-expanded={aberto}
        aria-controls={listaId}
        aria-autocomplete="list"
        aria-activedescendant={aberto && opcoes[ativo] ? `${listaId}-${ativo}` : undefined}
        placeholder="Digite para buscar o curso"
        className={cn(className, "pr-9")}
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setAberto(true);
          setAtivo(0);
        }}
        onFocus={() => setAberto(true)}
        onBlur={() => setAberto(false)}
        onKeyDown={aoTeclar}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={aberto ? "Fechar lista de cursos" : "Abrir lista de cursos"}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
        // mousedown + preventDefault: não tira o foco do campo
        onMouseDown={(e) => {
          e.preventDefault();
          setAberto((a) => !a);
          campo.current?.focus();
        }}
      >
        <ChevronDown className={cn("size-4 transition-transform", aberto && "rotate-180")} />
      </button>

      {aberto && (
        <ul
          id={listaId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border bg-popover p-1 text-sm shadow-lg sm:min-w-[28rem]"
        >
          {opcoes.length === 0 ? (
            <li className="px-3 py-2 text-muted-foreground">
              Nenhum curso no catálogo. Pode digitar o nome mesmo assim.
            </li>
          ) : (
            opcoes.map((curso, i) => (
              <li
                key={curso.nome}
                id={`${listaId}-${i}`}
                role="option"
                aria-selected={i === ativo}
                className={cn(
                  "flex cursor-pointer items-start gap-2 rounded-md px-3 py-2",
                  i === ativo && "bg-muted",
                )}
                onMouseEnter={() => setAtivo(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  escolher(curso);
                }}
              >
                <Check
                  className={cn(
                    "mt-0.5 size-4 shrink-0 text-primary",
                    normalizarBusca(curso.nome) === escolhido ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="flex-1">
                  <span className="block text-foreground">{curso.nome}</span>
                  <span className="text-xs text-muted-foreground">
                    {curso.cargaHoraria} h ·{" "}
                    {curso.capacidadesTecnicas.length + curso.capacidadesSocioemocionais.length} capacidades
                  </span>
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
