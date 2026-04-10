import { redirect, notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/getUserContext";
import { prisma } from "@/lib/prisma";
import { DinamicaDetalle } from "@/components/dinamicas/DinamicaDetalle";

export const dynamic = "force-dynamic";

export default async function DinamicaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireRole(["admin", "operadora"]);
  if (!ctx) redirect("/login?redirect=/dashboard/dinamicas");

  const { id } = await params;

  const dinamica = await prisma.dinamica.findUnique({
    where: { id },
    include: {
      productoPremio: {
        select: {
          id: true,
          nombre: true,
          precio: true,
          imagenes: { select: { url: true }, orderBy: { orden: "asc" }, take: 1 },
        },
      },
      clientaGanadora: {
        select: { id: true, nombre: true, telefono: true },
      },
      boletos: {
        include: {
          clienta: { select: { id: true, nombre: true, telefono: true } },
          comprobante: {
            select: { id: true, estatus: true, monto: true, metodoPago: true },
          },
        },
        orderBy: { numero: "asc" },
      },
      historial: {
        orderBy: { creadoEn: "desc" },
      },
    },
  });

  if (!dinamica) notFound();

  return (
    <div className="container mx-auto p-6">
      <DinamicaDetalle dinamica={JSON.parse(JSON.stringify(dinamica))} />
    </div>
  );
}
