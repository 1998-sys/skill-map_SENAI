"use client";

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";

// Vídeo de fundo da tela de login (decorativo).
// - Sem som, em loop, começa sozinho (autoPlay só funciona com muted + playsInline).
// - Telas mais largas que o vídeo (16:9 ou mais — quase todo navegador de
//   computador): enquadramento SOB MEDIDA. O vídeo preenche a tela o máximo
//   possível sem distorcer, mas sempre mostra a FAIXA IMPORTANTE — do logo SENAI
//   (a ~5% do topo) até o bloco amarelo "SENAI-SP" (termina a ~93% da altura).
//   Se preencher tudo cortasse essa faixa, sobram faixas finas nas laterais,
//   preenchidas pela cópia desfocada. Medido quadro a quadro no vídeo atual —
//   ao trocar o vídeo, revise FAIXA_IMPORTANTE.
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

// Parte da ALTURA do vídeo que nunca pode ser cortada (0 = topo, 1 = base).
const FAIXA_IMPORTANTE = { topo: 0.04, base: 0.95 };
const PROPORCAO = 16 / 9; // 1920x1080

// Calcula tamanho e posição do vídeo principal em telas largas; null nas
// estreitas (aí vale o object-contain das classes).
function useEnquadramento(ref: RefObject<HTMLDivElement | null>) {
  const [estilo, setEstilo] = useState<CSSProperties | null>(null);
  useEffect(() => {
    const caixa = ref.current;
    if (!caixa) return;
    const medir = () => {
      const W = caixa.clientWidth;
      const H = caixa.clientHeight;
      if (!W || !H || W / H < PROPORCAO) {
        setEstilo(null);
        return;
      }
      const alturaCobrindo = W / PROPORCAO; // preenche a largura toda
      const alturaMaxima = H / (FAIXA_IMPORTANTE.base - FAIXA_IMPORTANTE.topo);
      const h = Math.min(alturaCobrindo, alturaMaxima);
      const w = h * PROPORCAO;
      // Centraliza a faixa importante na tela, sem deixar buraco em cima/embaixo.
      const centroFaixa = ((FAIXA_IMPORTANTE.topo + FAIXA_IMPORTANTE.base) / 2) * h;
      const topo = Math.min(0, Math.max(H - h, H / 2 - centroFaixa));
      setEstilo({ width: w, height: h, left: (W - w) / 2, top: topo });
    };
    const observador = new ResizeObserver(medir); // mede já ao começar a observar
    observador.observe(caixa);
    return () => observador.disconnect();
  }, [ref]);
  return estilo;
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
  const caixa = useRef<HTMLDivElement>(null);
  const principal = useRef<HTMLVideoElement>(null);
  const desfocado = useRef<HTMLVideoElement>(null);
  useCorte(principal, fim);
  useCorte(desfocado, fim);
  const enquadramento = useEnquadramento(caixa);

  return (
    <div
      ref={caixa}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-title"
    >
      {/* Cópia desfocada: preenche as sobras ao redor do vídeo inteiro. */}
      <video
        ref={desfocado}
        {...atributos}
        src={src}
        tabIndex={-1}
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-90 blur-2xl brightness-90"
      />
      {/* Computador: enquadramento sob medida. Celular em pé: inteiro no alto. */}
      <video
        ref={principal}
        {...atributos}
        src={src}
        style={enquadramento ?? undefined}
        className={`absolute brightness-110 contrast-110 saturate-125 ${
          enquadramento ? "object-fill" : "inset-0 h-full w-full object-contain object-top"
        }`}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/25" />
    </div>
  );
}
