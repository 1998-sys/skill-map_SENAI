import Image from "next/image";

// Cartão centralizado das telas de acesso (fora do menu lateral), no mesmo
// visual da tela de login: faixa vermelha, logo SENAI e título.
export function CartaoAcesso({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="h-1 bg-primary" aria-hidden="true" />
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <Image src="/brand/senai.svg" alt="SENAI" width={160} height={53} priority />
            <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-title">
              {titulo}
            </h1>
            <div className="mt-3 h-1 w-14 bg-primary" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">{descricao}</p>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
