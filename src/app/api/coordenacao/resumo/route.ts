import { getCurrentProfile } from "@/lib/auth";
import { gerarResumoStream, lerConteudo } from "@/lib/ia/resumo";

// O resumo chama a API da IA e é transmitido aos poucos (streaming).
export const maxDuration = 60;

function erro(mensagem: string, status: number) {
  return new Response(mensagem, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

// POST /api/coordenacao/resumo — resumo da turma em streaming (texto puro).
// Exclusivo para a Coordenação; mesmo conteúdo e regras da antiga server action.
export async function POST(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return erro("Sessão expirada. Entre novamente.", 401);
  if (profile.role !== "COORDENACAO") {
    return erro("Acesso restrito à Coordenação.", 403);
  }
  if (!process.env.OPENAI_API_KEY) {
    return erro("A chave da API da OpenAI não está configurada (OPENAI_API_KEY).", 500);
  }

  let conteudo;
  try {
    conteudo = lerConteudo(await req.json());
  } catch {
    conteudo = null;
  }
  if (!conteudo) return erro("Dados da turma inválidos.", 400);
  if (conteudo.totalEnviados === 0) {
    return erro("Esta turma ainda não tem registros enviados.", 400);
  }

  const encoder = new TextEncoder();
  const pedacos = gerarResumoStream(conteudo, req.signal);

  // Puxa o primeiro pedaço antes de responder: se a chamada à IA falhar logo,
  // o cliente recebe um erro claro em vez de um stream vazio.
  let primeiro: IteratorResult<string>;
  try {
    primeiro = await pedacos.next();
  } catch (e) {
    return erro(e instanceof Error ? e.message : "Falha ao chamar a IA.", 502);
  }

  const corpo = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (!primeiro.done) controller.enqueue(encoder.encode(primeiro.value));
        for await (const texto of pedacos) controller.enqueue(encoder.encode(texto));
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
    async cancel() {
      await pedacos.return(undefined);
    },
  });

  return new Response(corpo, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
