import { Carregando } from "@/components/carregando";

// Carregamento das telas internas: o menu continua na tela e só o conteúdo
// vira esqueleto enquanto os dados chegam.
export default function Loading() {
  return <Carregando />;
}
