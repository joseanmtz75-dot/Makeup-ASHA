import { redirect, notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/getUserContext";
import { prisma } from "@/lib/prisma";
import { DinamicaForm } from "@/components/dinamicas/DinamicaForm";
import { Ticket } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditarDinamicaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireRole(["admin"]);
  if (!ctx) redirect("/login?redirect=/dashboard/dinamicas");

  const { id } = await params;

  const dinamica = await prisma.dinamica.findUnique({
    where: { id },
  });

  if (!dinamica) notFound();

  if (dinamica.estatus !== "BORRADOR") {
    redirect(`/dashboard/dinamicas/${id}`);
  }

  const productos = await prisma.producto.findMany({
    where: { activo: true },
    select: {
      id: true,
      nombre: true,
      precio: true,
      imagenes: {
        select: { url: true },
        orderBy: { orden: "asc" },
        take: 1,
      },
    },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="container mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Ticket className="h-8 w-8 text-primary" />
          Editar dinámica
        </h1>
      </div>

      <DinamicaForm
        modo="editar"
        dinamica={JSON.parse(JSON.stringify(dinamica))}
        productos={JSON.parse(JSON.stringify(productos))}
      />
    </div>
  );
}
