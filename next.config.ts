import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Importação de capacidades por PDF: o PDF do Plano de Curso vai numa Server
  // Action (padrão é 1 MB). A ação aceita até 4 MB; a Vercel aceita até 4,5 MB.
  experimental: {
    serverActions: { bodySizeLimit: "5mb" },
  },
  // "Cache Components" desligado: o app é quase todo autenticado/por-requisição
  // (sessão + banco), então páginas dinâmicas são o padrão esperado aqui.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
