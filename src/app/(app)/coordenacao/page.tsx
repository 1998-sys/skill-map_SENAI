import { redirect } from "next/navigation";

// O antigo "Painel da Coordenação" foi unido ao Dashboard (tela única).
// Quem tiver o endereço antigo salvo cai direto no Dashboard.
export default function CoordenacaoPage() {
  redirect("/coordenacao/dashboard");
}
