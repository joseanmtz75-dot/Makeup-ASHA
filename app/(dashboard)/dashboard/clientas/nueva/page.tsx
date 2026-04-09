import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/getUserContext";
import { ClientaForm } from "@/components/clientas/ClientaForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Nueva clienta" };

export default async function NuevaClientaPage() {
  const ctx = await requireRole(["admin", "operadora"]);
  if (!ctx) redirect("/login?redirect=/dashboard/clientas/nueva");

  return (
    <div className="container mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <Link
          href="/dashboard/clientas"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a clientas
        </Link>
        <h1 className="text-3xl font-bold">Nueva clienta</h1>
        <p className="text-sm text-muted-foreground">
          Registra manualmente a una clienta nueva.
        </p>
      </div>

      <ClientaForm modo="crear" />
    </div>
  );
}
