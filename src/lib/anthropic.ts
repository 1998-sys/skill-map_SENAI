import Anthropic from "@anthropic-ai/sdk";

// Client da Anthropic — SOMENTE no servidor (usa ANTHROPIC_API_KEY).
// A chamada de análise pedagógica será implementada na Etapa 3.
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Modelo definido por env; será confirmado na Etapa 3 (ver skill claude-api).
export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "";
