import { buscarTurma, buscarUltimoResumo, listarRegistrosComUltimaAnalise } from "@/lib/db/consultas";
import type { ConteudoConsolidado } from "@/lib/ia/resumo";
import { formatarData } from "@/lib/datas";

// Dados do acompanhamento de uma turma para a Coordenação — usados pela tela
// /coordenacao/turmas/[id] e pela página de impressão. Só registros ENVIADOS,
// cada um com a última análise VALIDADA (rascunhos não entram).

export type ItemAgrupado = { texto: string; n: number };

// Junta itens iguais (mesmo texto) e conta em quantos registros aparecem,
// do mais frequente para o menos.
export function agrupar(itens: string[]): ItemAgrupado[] {
  const mapa = new Map<string, ItemAgrupado>();
  for (const item of itens) {
    const chave = item.trim().toLowerCase();
    if (!chave) continue;
    const atual = mapa.get(chave);
    if (atual) atual.n += 1;
    else mapa.set(chave, { texto: item.trim(), n: 1 });
  }
  return [...mapa.values()].sort((a, b) => b.n - a.n);
}

export async function montarAcompanhamento(turmaId: string) {
  const dados = await buscarTurma(turmaId);
  if (!dados) return null;

  const [enviados, resumoSalvo] = await Promise.all([
    listarRegistrosComUltimaAnalise(turmaId, { status: "ENVIADO", tipoAnalise: "VALIDADA" }),
    buscarUltimoResumo(turmaId),
  ]);

  const ultimoEnvio = enviados.reduce<Date | null>((max, r) => {
    if (!r.enviadoEm) return max;
    return !max || r.enviadoEm > max ? r.enviadoEm : max;
  }, null);

  const pontosPositivos: string[] = [];
  const pontosAtencao: string[] = [];
  const sugestoes: string[] = [];
  for (const r of enviados) {
    const a = r.ultimaAnalise;
    if (!a) continue;
    pontosPositivos.push(...a.pontosPositivos);
    pontosAtencao.push(...a.pontosAtencao);
    sugestoes.push(...a.sugestoes);
  }

  // Para o resumo com IA: cada registro enviado em ordem cronológica, para a
  // IA apontar a evolução da turma.
  const conteudo: ConteudoConsolidado = {
    turmaNome: dados.nome,
    cursoNome: dados.curso.nome,
    totalEnviados: enviados.length,
    registros: [...enviados]
      .sort((x, y) => x.data.getTime() - y.data.getTime())
      .flatMap((r) => {
        const a = r.ultimaAnalise;
        if (!a) return [];
        return [
          {
            data: formatarData(r.data),
            tema: r.tema,
            capacidades: a.capacidades.map((c) => c.texto),
            pontosPositivos: a.pontosPositivos,
            pontosAtencao: a.pontosAtencao,
            sugestoes: a.sugestoes,
            observacoes: a.observacoesAdicionais,
          },
        ];
      }),
  };

  return {
    turma: dados,
    enviados,
    ultimoEnvio,
    pontosPositivos,
    atencaoAgrupada: agrupar(pontosAtencao),
    sugestoesAgrupadas: agrupar(sugestoes),
    conteudo,
    resumoSalvo,
  };
}
