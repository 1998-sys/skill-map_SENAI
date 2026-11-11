// Catálogo de cursos SENAI-SP com as capacidades do Plano de Curso.
// Na "Nova turma", ao escolher um curso daqui, o nome, a carga horária e as
// capacidades são preenchidos sozinhos (o professor ainda pode editar).
//
// Para incluir um curso: copie as capacidades da "Ementa de Conteúdos
// Formativos" do Plano de Curso (técnicas e socioemocionais), uma por item.

export type CursoCatalogo = {
  nome: string;
  cargaHoraria: number;
  capacidadesTecnicas: string[];
  capacidadesSocioemocionais: string[];
};

export const CATALOGO_CURSOS: CursoCatalogo[] = [
  {
    nome: "Inteligências Artificiais Generativas Aplicada a Programação – ChatGPT",
    cargaHoraria: 48,
    capacidadesTecnicas: [
      "Identificar inteligências artificiais generativas, suas arquiteturas e funcionamento",
      "Treinar IA, utilizando os fundamentos do aprendizado de máquina",
      "Criar um chatbot personalizado utilizando o processamento de linguagem natural (NLP)",
      "Estruturar e codificar solução utilizando inteligências artificiais",
      "Corrigir erros em scripts, builds e deploys com ChatGPT",
      "Refatorar códigos com ChatGPT",
      "Aplicar o processo de treinamento personalizado do ChatGPT através de API, incluindo a coleta e pré-processamento de dados, ajuste de parâmetros, e avaliação do modelo e redes neurais",
      "Implementar o ChatGPT em aplicações de chatbot usando suas bibliotecas e APIs",
    ],
    capacidadesSocioemocionais: [
      "Demonstrar raciocínio lógico",
      "Demonstrar atenção aos detalhes",
    ],
  },
  {
    nome: "Machine Learning Aplicada à Indústria",
    cargaHoraria: 60,
    capacidadesTecnicas: [
      "Realizar pré-processamento de dados para projetos de machine learning",
      "Desenvolver algoritmos supervisionados e não supervisionados para machine learning",
      "Avaliar desempenho de modelos para machine learning",
      "Interpretar resultados de métricas de avaliação de modelos para tomada de decisão",
    ],
    capacidadesSocioemocionais: [
      "Demonstrar atenção a detalhes",
      "Organizar o ambiente de trabalho e as atividades",
      "Zelar pelo uso de equipamentos, instrumentos, ferramentas e materiais",
    ],
  },
  {
    nome: "Power BI e Análise de Dados com IA",
    cargaHoraria: 40,
    capacidadesTecnicas: [
      "Elaborar prompts com boas práticas, baseando-se em técnicas de engenharia de prompt, sem infringir o uso ético da inteligência artificial",
      "Implementar modelos de IA supervisionados e não supervisionados por meio de plataformas no code, scripts e avaliar as principais métricas",
      "Analisar dados identificando padrões, insights e respondendo a perguntas a partir de relatórios e criação de visuais",
      "Realizar o processo de ETL (Extração, Transformação e Carga) de uma base de dados para o Power BI",
      "Modelar dados com o Power BI por meio de relacionamento de tabelas e funções DAX",
      "Fornecer representações visuais de dados usando o Power BI",
      "Elaborar prompts de IA para tarefas do Power BI",
    ],
    capacidadesSocioemocionais: [
      "Administrar o tempo",
      "Organizar o ambiente de trabalho e as atividades",
      "Zelar pelo uso de equipamentos, instrumentos, ferramentas e materiais",
      "Demonstrar atenção a detalhes",
      "Demonstrar senso crítico",
      "Demonstrar raciocínio lógico",
      "Demonstrar empatia",
    ],
  },
  {
    nome: "Programação em Python",
    cargaHoraria: 60,
    capacidadesTecnicas: [
      "Identificar os requisitos do problema para definição dos recursos a serem utilizados",
      "Elaborar algoritmo da solução do problema",
      "Configurar o ambiente de desenvolvimento em Python",
      "Programar em linguagem Python",
      "Programar jogos 2D em linguagem Python",
      "Validar software por meio de testes",
    ],
    capacidadesSocioemocionais: [
      "Demonstrar autogestão",
      "Demonstrar pensamento analítico",
      "Demonstrar inteligência emocional",
      "Demonstrar autonomia",
    ],
  },
].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

// Compara sem acento e sem maiúsculas ("maquina" acha "Máquina").
export function normalizarBusca(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// Cursos cujo nome contém todas as palavras digitadas, em qualquer ordem.
export function buscarCursos(termo: string): CursoCatalogo[] {
  const palavras = normalizarBusca(termo).split(/\s+/).filter(Boolean);
  if (palavras.length === 0) return CATALOGO_CURSOS;
  return CATALOGO_CURSOS.filter((c) => {
    const nome = normalizarBusca(c.nome);
    return palavras.every((p) => nome.includes(p));
  });
}

export function capacidadesDoCurso(curso: CursoCatalogo): string[] {
  return [...curso.capacidadesTecnicas, ...curso.capacidadesSocioemocionais];
}
