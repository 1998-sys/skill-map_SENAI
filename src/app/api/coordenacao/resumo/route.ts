import { getCurrentProfile } from "@/lib/auth";
import { gerarResumoStream, lerConteudo } from "@/lib/ia/resumo";
import { buscarTurma } from "@/lib/db/consultas";
import { db, novoId } from "@/lib/db/cliente";

// O resumo chama a API da IA e é transmitido aos poucos (streaming).
export const maxDuration = 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function erro(mensagem: string, status: number) {
  return new Response(mensagem, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

// POST /api/coordenacao/resumo — resumo da turma em streaming (texto puro).
// Exclusivo para a Coordenação. Corpo: o ConteudoConsolidado + `turmaId`.
// Quando a IA termina (sem o usuário parar), o texto completo é salvo em
// `resumos_turma` — a tela passa a mostrar esse último resumo.
export async function POST(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return erro("Sessão expirada. Entre novamente.", 401);
  if (profile.role !== "COORDENACAO") {
    return erro("Acesso restrito à Coordenação.", 403);
  }
  if (!process.env.OPENAI_API_KEY) {
    return erro("A chave da API da OpenAI não está configurada (OPENAI_API_KEY).", 500);
  }

  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    corpo = null;
  }
  const conteudo = lerConteudo(corpo);
  if (!conteudo) return erro("Dados da turma inválidos.", 400);
  if (conteudo.totalEnviados === 0) {
    return erro("Esta turma ainda não tem registros enviados.", 400);
  }
  const turmaIdBruto = (corpo as { turmaId?: unknown }).turmaId;
  const turmaId =
    typeof turmaIdBruto === "string" && UUID.test(turmaIdBruto) ? turmaIdBruto : null;
  if (!turmaId || !(await buscarTurma(turmaId))) {
    return erro("Turma não encontrada.", 404);
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

  const resposta = new ReadableStream<Uint8Array>({
    async start(controller) {
      let completo = "";
      try {
        if (!primeiro.done) {
          completo += primeiro.value;
          controller.enqueue(encoder.encode(primeiro.value));
        }
        for await (const texto of pedacos) {
          completo += texto;
          controller.enqueue(encoder.encode(texto));
        }
        // Terminou inteiro: guarda. Falha ao salvar não estraga a resposta.
        if (completo.trim() && !req.signal.aborted) {
          const { error } = await db().from("resumos_turma").insert({
            id: novoId(),
            turma_id: turmaId,
            texto: completo.trim(),
            total_registros: conteudo.totalEnviados,
            gerado_por: profile.id,
          });
          if (error) console.error("[resumo] não foi possível salvar:", error.message);
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
    async cancel() {
      await pedacos.return(undefined);
    },
  });

  return new Response(resposta, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
