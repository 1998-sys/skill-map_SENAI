import { redirect } from "next/navigation";

// A raiz leva ao dashboard; o middleware encaminha para /login se não houver sessão.
export default function Home() {
  redirect("/dashboard");
}
