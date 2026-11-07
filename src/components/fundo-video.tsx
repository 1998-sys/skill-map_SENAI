"use client";

import { useEffect, useRef } from "react";

// Vídeo de fundo da tela de login (decorativo).
// - Sem som, em loop, começa sozinho (autoPlay só funciona com muted + playsInline).
// - Película escura por cima: o cartão de login fica legível e a pequena perda de
//   nitidez do vídeo 720p em telas grandes não aparece.
// - Quem pediu "menos movimento" no sistema (no Windows: "Mostrar animações"
//   desligado, comum em computadores de escola) vê o vídeo PARADO, como uma foto
//   de fundo, em vez de sumir.
// O pai precisa ter `relative isolate` para o vídeo ficar atrás do conteúdo.

const QUADRO_PARADO = 1.5; // segundo do vídeo usado como imagem de fundo

export function FundoVideo({ src = "/login/fundo-login.mp4" }: { src?: string }) {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const preferencia = window.matchMedia("(prefers-reduced-motion: reduce)");

    function aplicar() {
      if (!v) return;
      if (preferencia.matches) {
        v.pause();
        v.currentTime = QUADRO_PARADO;
      } else {
        v.play().catch(() => {}); // navegador pode bloquear: fica no primeiro quadro
      }
    }

    if (v.readyState >= 1) aplicar();
    else v.addEventListener("loadedmetadata", aplicar, { once: true });
    preferencia.addEventListener("change", aplicar);
    return () => preferencia.removeEventListener("change", aplicar);
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-title">
      <video
        ref={video}
        className="h-full w-full object-cover"
        src={src}
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/60" />
    </div>
  );
}
