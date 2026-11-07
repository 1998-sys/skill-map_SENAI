"use client";

import { useEffect, useRef, type RefObject } from "react";

// Vídeo de fundo da tela de login (decorativo).
// - Sem som, em loop, começa sozinho (autoPlay só funciona com muted + playsInline).
// - Vídeo INTEIRO na tela (object-contain): nada é cortado no computador nem no
//   celular. As sobras (laterais no computador, em cima/embaixo no celular) são
//   preenchidas por uma cópia desfocada do mesmo vídeo, em vez de faixas pretas.
// - No celular em pé o vídeo fica no alto da tela; o cartão de login, mais abaixo.
// - Película escura por cima: o cartão fica legível.
// - Corte do final: o arquivo termina com uma tela amarela (~11,1 s até o fim)
//   que não usamos; o vídeo volta ao início em `fim` segundos. Para cortar o
//   arquivo de verdade: ffmpeg -i fundo-login.mp4 -t 10.8 -c copy saida.mp4
// O pai precisa ter `relative isolate` para o vídeo ficar atrás do conteúdo.

// Volta o vídeo ao início antes de `fim`. requestVideoFrameCallback confere a
// cada quadro (preciso); onde não existe, timeupdate (~4x/s) com folga de 0,3 s.
function useCorte(ref: RefObject<HTMLVideoElement | null>, fim: number) {
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.play().catch(() => {});
    const conferir = () => {
      if (v.currentTime >= fim) v.currentTime = 0;
    };
    if (typeof v.requestVideoFrameCallback === "function") {
      let quadro = 0;
      const aCadaQuadro = () => {
        conferir();
        quadro = v.requestVideoFrameCallback(aCadaQuadro);
      };
      quadro = v.requestVideoFrameCallback(aCadaQuadro);
      return () => v.cancelVideoFrameCallback(quadro);
    }
    v.addEventListener("timeupdate", conferir);
    return () => v.removeEventListener("timeupdate", conferir);
  }, [ref, fim]);
}

const atributos = {
  autoPlay: true,
  muted: true,
  loop: true,
  playsInline: true,
  preload: "auto",
  disablePictureInPicture: true,
} as const;

export function FundoVideo({
  src = "/login/fundo-login.mp4",
  fim = 10.8, // segundos — antes da tela amarela (começa em ~11,1 s)
}: {
  src?: string;
  fim?: number;
}) {
  const principal = useRef<HTMLVideoElement>(null);
  const desfocado = useRef<HTMLVideoElement>(null);
  useCorte(principal, fim);
  useCorte(desfocado, fim);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-title">
      {/* Cópia desfocada: preenche as sobras ao redor do vídeo inteiro. */}
      <video
        ref={desfocado}
        {...atributos}
        src={src}
        tabIndex={-1}
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-2xl"
      />
      {/* Vídeo inteiro, sem corte: no alto no celular, centralizado no computador. */}
      <video
        ref={principal}
        {...atributos}
        src={src}
        className="absolute inset-0 h-full w-full object-contain object-top sm:object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/55" />
    </div>
  );
}
