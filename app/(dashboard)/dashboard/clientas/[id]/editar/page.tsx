import { redirect, notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/getUserContext";
import { prisma } from "@/lib/prisma";
import { ClientaForm } from "@/components/clientas/ClientaForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Editar clienta" };

export default async function EditarClientaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireRole(["admin", "operadora"]);
  if (!ctx) redirect("/login?redirect=/dashboard/clientas");

  const { id } = await params;
  const clienta = await prisma.clienta.findUnique({ where: { id } });
  if (!clienta) notFound();

  return (
    <div className="container mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <Link
          href={`/dashboard/clientas/${id}`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al perfil
        </Link>
        <h1 className="text-3xl font-bold">Editar clienta</h1>
      </div>

      <ClientaForm modo="editar" clienta={clienta} />
    </div>
  );
}
