"use client";

import { useEffect, useRef, type RefObject } from "react";

// Vídeo de fundo da tela de login (decorativo).
// - Sem som, em loop, começa sozinho (autoPlay só funciona com muted + playsInline).
// - Telas mais largas que o vídeo (16:9 ou mais — quase todo navegador de
//   computador, já que abas e barra de endereço "achatam" a área): PREENCHE a
//   tela toda sem distorcer (object-cover). Como a área do site quase nunca tem
//   exatamente 16:9, uma faixa fica de fora — ancoramos no TOPO para o logo SENAI
//   do canto superior nunca ser cortado; o que sai é um pedaço de baixo.
// - Telas mais estreitas (celular, tablet, monitor 4:3): preencher cortaria as
//   laterais (e o logo SENAI da direita), então o vídeo aparece
//   INTEIRO no alto (object-contain) e o cartão de login fica mais abaixo. As
//   sobras são preenchidas por uma cópia desfocada do mesmo vídeo.
// - Imagem mais viva: brilho, contraste e saturação levemente aumentados no
//   vídeo principal (não muda a resolução, só a aparência). Película bem leve,
//   porque o cartão de login já tem o próprio fundo escuro translúcido.
// - Arquivo: public/login/fundo-login-v2.mp4 — trecho de 4 s a 14 s do vídeo
//   institucional, 1920x1080, ~11 s, sem som, comprimido para ~4 MB:
//   ffmpeg -i entrada.mp4 -an -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p
//          -movflags +faststart fundo-login-v2.mp4
//   (Ao trocar o vídeo, use um nome novo para o navegador não mostrar o antigo
//   guardado em cache.)
// - `fim` (opcional): segundo em que o vídeo volta ao início, para pular um
//   final indesejado sem editar o arquivo. Sem `fim`, roda inteiro em loop.
// O pai precisa ter `relative isolate` para o vídeo ficar atrás do conteúdo.

// Garante que o vídeo toque e, se houver `fim`, volta ao início nesse ponto.
// requestVideoFrameCallback confere a cada quadro (preciso); onde não existe,
// timeupdate (~4x/s).
function useCorte(ref: RefObject<HTMLVideoElement | null>, fim?: number) {
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.play().catch(() => {});
    if (fim == null) return; // sem corte: o loop do próprio vídeo resolve
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
  src = "/login/fundo-login-v2.mp4",
  fim,
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
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-90 blur-2xl brightness-90"
      />
      {/* Computador: tela cheia (ancorado no topo). Celular em pé: inteiro no alto. */}
      <video
        ref={principal}
        {...atributos}
        src={src}
        className="absolute inset-0 h-full w-full object-contain object-top brightness-110 contrast-110 saturate-125 [@media(min-aspect-ratio:16/9)]:object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/25" />
    </div>
  );
}
