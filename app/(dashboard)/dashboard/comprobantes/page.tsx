import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/getUserContext";
import { createAdminClient } from "@/lib/supabase/admin";
import { Receipt } from "lucide-react";
import { ComprobantesQueue } from "@/components/comprobantes/ComprobantesQueue";

export const metadata = { title: "Comprobantes" };
export const dynamic = "force-dynamic";

export default async function ComprobantesPage() {
  const ctx = await requireRole(["admin", "operadora"]);
  if (!ctx) redirect("/login?redirect=/dashboard/comprobantes");

  const pendientes = await prisma.comprobante.findMany({
    where: { estatus: "PENDIENTE" },
    include: {
      compra: {
        include: {
          clienta: true,
          producto: { include: { imagenes: { take: 1 } } },
        },
      },
    },
    orderBy: { creadoEn: "asc" },
  });

  // Generar signed URLs para previews
  const supabase = createAdminClient();
  const conUrls = await Promise.all(
    pendientes.map(async (comp) => {
      const { data } = await supabase.storage
        .from("comprobantes-privado")
        .createSignedUrl(comp.imagenUrl, 600);
      return { ...comp, imagenUrlFirmada: data?.signedUrl ?? "" };
    })
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Receipt className="h-8 w-8 text-primary" />
          Comprobantes pendientes
        </h1>
        <p className="text-sm text-muted-foreground">
          {pendientes.length}{" "}
          {pendientes.length === 1
            ? "comprobante por revisar"
            : "comprobantes por revisar"}
        </p>
      </div>

      <ComprobantesQueue comprobantes={conUrls} />
    </div>
  );
}
