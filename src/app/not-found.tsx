import { NaoEncontrado } from "@/components/nao-encontrado";

// 404 para endereços que não existem (fora das telas internas).
export default function NotFound() {
  return (
    <div className="flex min-h-screen">
      <NaoEncontrado />
    </div>
  );
}
