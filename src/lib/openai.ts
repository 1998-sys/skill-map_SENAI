import OpenAI from "openai";

// Client da OpenAI — SOMENTE no servidor (usa OPENAI_API_KEY).
// Criado de forma lazy para não exigir a chave em tempo de build.
let _client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

// Modelo definido por env; padrão gpt-5-nano (menor custo).
export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "";
