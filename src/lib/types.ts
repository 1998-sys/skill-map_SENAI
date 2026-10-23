// Tipos compartilhados do domínio SkillMap.

export type Role = "PROFESSOR" | "COORDENACAO";

// Formato ESTRUTURADO que a IA deve devolver (Etapa 3).
// `capacidades_identificadas` são sempre IDs de capacidades já cadastradas.
export interface AnaliseIAResult {
  capacidades_identificadas: string[];
  pontos_positivos: string[];
  pontos_atencao: string[];
  sugestoes: string[];
  observacoes_adicionais?: string;
}
