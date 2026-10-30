import { NaoEncontrado } from "@/components/nao-encontrado";

// 404 dentro das telas internas (com menu lateral): chamado pelo notFound()
// quando a turma/registro não existe ou foi excluído.
export default function NotFound() {
  return <NaoEncontrado />;
}
