import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
