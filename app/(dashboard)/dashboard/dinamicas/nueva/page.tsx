import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/getUserContext";
import { prisma } from "@/lib/prisma";
import { DinamicaForm } from "@/components/dinamicas/DinamicaForm";
import { Ticket } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NuevaDinamicaPage() {
  const ctx = await requireRole(["admin"]);
  if (!ctx) redirect("/login?redirect=/dashboard/dinamicas/nueva");

  // Traer productos activos para seleccionar como premio
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
          Nueva dinámica
        </h1>
        <p className="text-sm text-muted-foreground">
          Define los detalles de la dinámica. Podrás activarla cuando esté
          lista.
        </p>
      </div>

      <DinamicaForm
        modo="crear"
        productos={JSON.parse(JSON.stringify(productos))}
      />
    </div>
  );
}
