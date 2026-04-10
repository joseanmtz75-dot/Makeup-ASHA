import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/getUserContext";
import { prisma } from "@/lib/prisma";
import { CancelacionesQueue } from "@/components/dinamicas/CancelacionesQueue";
import { Ban } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CancelacionesPage() {
  const ctx = await requireRole(["admin", "operadora"]);
  if (!ctx) redirect("/login?redirect=/dashboard/cancelaciones");

  const solicitudes = await prisma.solicitudCancelacion.findMany({
    where: { estatus: "PENDIENTE" },
    include: {
      clienta: {
        select: { id: true, nombre: true, telefono: true },
      },
      boleto: {
        select: {
          id: true,
          numero: true,
          dinamica: {
            select: { id: true, nombre: true, precioBoleto: true },
          },
        },
      },
      compra: {
        select: {
          id: true,
          total: true,
          producto: { select: { id: true, nombre: true } },
        },
      },
    },
    orderBy: { creadoEn: "asc" },
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Ban className="h-8 w-8 text-primary" />
          Cancelaciones
        </h1>
        <p className="text-sm text-muted-foreground">
          {solicitudes.length} solicitudes pendientes de revisión
        </p>
      </div>

      <CancelacionesQueue
        solicitudes={JSON.parse(JSON.stringify(solicitudes))}
      />
    </div>
  );
}
