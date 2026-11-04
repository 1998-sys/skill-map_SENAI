"use server";

import { getCurrentProfile } from "@/lib/auth";
import { extrairCapacidadesDoPdf, type UnidadeExtraida } from "@/lib/ia/capacidades-pdf";

// Lê o PDF do Plano de Curso e devolve as capacidades SUGERIDAS pela IA.
// Não grava nada: quem salva é o professor, depois de revisar na tela.
// O PDF não é guardado — é lido e descartado.

export type LeituraPdfState = { error?: string; unidades?: UnidadeExtraida[] };

// Limite de envio das funções da Vercel é 4,5 MB; folga para o resto da requisição.
const TAMANHO_MAXIMO = 4 * 1024 * 1024;

export async function lerPlanoDeCurso(formData: FormData): Promise<LeituraPdfState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Sua sessão expirou. Entre de novo." };

  const arquivo = formData.get("pdf");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { error: "Escolha o PDF do Plano de Curso." };
  }
  if (arquivo.size > TAMANHO_MAXIMO) {
    return { error: "O arquivo passa de 4 MB. Use uma versão menor do PDF." };
  }

  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  // Confere a assinatura do arquivo ("%PDF"), não só a extensão.
  const assinatura = String.fromCharCode(...bytes.slice(0, 4));
  if (assinatura !== "%PDF") return { error: "Envie um arquivo PDF." };

  if (!process.env.OPENAI_API_KEY) {
    return { error: "A chave da IA (OPENAI_API_KEY) não está configurada." };
  }

  try {
    const unidades = await extrairCapacidadesDoPdf(bytes, arquivo.name);
    if (unidades.length === 0) {
      return {
        error:
          "Não encontramos capacidades neste PDF. Confira se é o Plano de Curso com a ementa de conteúdos formativos.",
      };
    }
    return { unidades };
  } catch (e) {
    const status = (e as { status?: number }).status;
    if (status === 401) {
      return { error: "A chave da IA (OPENAI_API_KEY) está inválida ou expirou." };
    }
    if (status === 429) {
      return { error: "Limite de uso da IA atingido. Tente de novo em alguns minutos." };
    }
    return { error: "Não foi possível ler o PDF agora. Tente de novo." };
  }
}
