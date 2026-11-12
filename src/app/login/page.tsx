"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FundoVideo } from "@/components/fundo-video";

// Cartão "vidro fosco" sobre o vídeo de fundo: escuro translúcido, texto
// claro e o vermelho SENAI nos destaques — combina com o vídeo em vez de
// destoar (o cartão branco brigava com a imagem).
const campoVidro =
  "h-11 w-full rounded-md border border-white/25 bg-white/10 px-3 text-[15px] text-white outline-none placeholder:text-white/50 transition-colors focus-visible:border-white/70 focus-visible:bg-white/15 focus-visible:ring-3 focus-visible:ring-white/20 disabled:opacity-60";

// Mensagem para cada tipo de falha do login (sem termos técnicos).
function mensagemDeErro(error: { code?: string; status?: number; name?: string }): string {
  if (error.code === "user_banned") {
    return "Seu acesso está desativado. Procure a Coordenação.";
  }
  if (error.code === "invalid_credentials") {
    return "E-mail ou senha incorretos. Confira e tente de novo.";
  }
  if (error.status === 429 || error.code === "over_request_rate_limit") {
    return "Muitas tentativas seguidas. Aguarde um minuto e tente de novo.";
  }
  // Sem resposta do servidor: internet fora do ar ou serviço instável.
  if (!error.status || error.status >= 500 || error.name === "AuthRetryableFetchError") {
    return "Não foi possível conectar. Confira a sua internet e tente de novo.";
  }
  return "Não foi possível entrar agora. Tente de novo em instantes.";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });
      if (error) {
        setErro(mensagemDeErro(error));
        setCarregando(false);
        return;
      }
    } catch {
      setErro("Não foi possível conectar. Confira a sua internet e tente de novo.");
      setCarregando(false);
      return;
    }
    // Deu certo: o botão continua em "Entrando..." até a tela inicial abrir.
    router.push("/dashboard");
    router.refresh();
  }

  // Celular: vídeo inteiro no alto e cartão mais abaixo; computador: centralizado.
  return (
    <main className="relative isolate flex min-h-svh items-end justify-center overflow-hidden p-4 pb-8 sm:min-h-screen sm:items-center sm:pb-4">
      <FundoVideo />
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/15 bg-black/60 text-white shadow-2xl backdrop-blur-md">
        <div className="h-1 bg-primary" aria-hidden="true" />
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <Image src="/brand/senai.svg" alt="SENAI" width={210} height={70} priority />
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-[42px]">
              SkillMap
            </h1>
            <div className="mt-3 h-1 w-14 bg-primary" aria-hidden="true" />
            <p className="mt-3 text-sm text-white/85">
              Entre para acessar o acompanhamento pedagógico.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-white/90">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                disabled={carregando}
                aria-invalid={erro ? true : undefined}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={campoVidro}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="senha" className="text-sm font-semibold text-white/90">
                Senha
              </label>
              <div className="relative">
                <input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  disabled={carregando}
                  aria-invalid={erro ? true : undefined}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className={`${campoVidro} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={mostrarSenha}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-md text-white/70 outline-none hover:text-white focus-visible:ring-3 focus-visible:ring-white/30"
                >
                  {mostrarSenha ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            {erro && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-md border border-red-300/30 bg-red-950/70 px-3 py-2 text-sm text-red-50"
              >
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{erro}</span>
              </p>
            )}

            <Button type="submit" size="lg" className="h-11 w-full text-[15px] font-semibold" disabled={carregando} aria-busy={carregando}>
              {carregando && <LoaderCircle className="animate-spin" aria-hidden="true" />}
              {carregando ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm">
            <Link href="/esqueci-senha" className="font-semibold text-white/85 underline-offset-4 hover:text-white hover:underline">
              Esqueci minha senha
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
