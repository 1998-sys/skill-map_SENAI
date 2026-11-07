"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

// Vídeo de fundo da tela de login (decorativo).
// - Sem som, em loop, começa sozinho (autoPlay só funciona com muted + playsInline).
// - Toca SEMPRE, mesmo com "menos movimento" ligado no sistema: nos computadores
//   do SENAI as animações do Windows costumam vir desligadas e o vídeo ficaria
//   parado para todos. Em troca, há um botão para pausar (acessibilidade: conteúdo
//   que se move sozinho precisa poder ser parado). A escolha fica lembrada.
// - Película escura por cima: o cartão fica legível e a pequena perda de nitidez
//   do vídeo 720p em telas grandes não aparece.
// - Corte do final: o arquivo termina com uma tela amarela ("competitividade
//   para a indústria", de ~11,1 s até o fim) que ficava atrás do cartão. O vídeo
//   volta ao início em `fim` segundos, então esse trecho nunca aparece. Para
//   cortar o arquivo de verdade: ffmpeg -i fundo-login.mp4 -t 10.8 -c copy saida.mp4
// O pai precisa ter `relative isolate` para o vídeo ficar atrás do conteúdo.

const CHAVE = "skillmap:video-login-pausado";

export function FundoVideo({
  src = "/login/fundo-login.mp4",
  fim = 10.8, // segundos — antes da tela amarela (começa em ~11,1 s)
}: {
  src?: string;
  fim?: number;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    const v = video.current;
    if (!v) return;

    // Lembra se a pessoa pausou da última vez (só neste navegador).
    let lembrado = false;
    try {
      lembrado = localStorage.getItem(CHAVE) === "1";
    } catch {
      // navegador sem armazenamento: segue tocando
    }
    // Só comanda o vídeo; o estado do botão vem dos eventos play/pause.
    if (lembrado) v.pause();
    else v.play().catch(() => {});

    // Volta ao início antes do trecho cortado. requestVideoFrameCallback confere
    // a cada quadro (preciso); onde não existe, o evento timeupdate (~4x/s) e a
    // folga de 0,3 s até a tela amarela dão conta.
    const comQuadros = typeof v.requestVideoFrameCallback === "function";
    let quadro = 0;
    const conferir = () => {
      if (v.currentTime >= fim) v.currentTime = 0;
    };
    const aCadaQuadro = () => {
      conferir();
      quadro = v.requestVideoFrameCallback(aCadaQuadro);
    };
    if (comQuadros) quadro = v.requestVideoFrameCallback(aCadaQuadro);
    else v.addEventListener("timeupdate", conferir);

    return () => {
      if (comQuadros) v.cancelVideoFrameCallback(quadro);
      else v.removeEventListener("timeupdate", conferir);
    };
  }, [fim]);

  function alternar() {
    const v = video.current;
    if (!v) return;
    const pausar = !v.paused;
    if (pausar) v.pause();
    else v.play().catch(() => {});
    try {
      localStorage.setItem(CHAVE, pausar ? "1" : "0");
    } catch {
      // sem armazenamento: só não lembra
    }
  }

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-title">
        <video
          ref={video}
          className="h-full w-full object-cover"
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          onPlay={() => setPausado(false)}
          onPause={() => setPausado(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/60" />
      </div>
      <button
        type="button"
        onClick={alternar}
        className="absolute right-4 bottom-4 flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm transition-colors hover:bg-black/65 focus-visible:outline-2 focus-visible:outline-white"
      >
        {pausado ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
        {pausado ? "Reproduzir vídeo" : "Pausar vídeo"}
      </button>
    </>
  );
}
