import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/getUserContext";
import { ShoppingCart } from "lucide-react";
import { PedidosLista } from "@/components/dashboard/PedidosLista";

export const metadata = { title: "Pedidos" };
export const dynamic = "force-dynamic";

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ estatus?: string }>;
}) {
  const ctx = await requireRole(["admin", "operadora"]);
  if (!ctx) redirect("/login?redirect=/dashboard/pedidos");

  const params = await searchParams;
  const estatusFiltro = params.estatus;

  const compras = await prisma.compra.findMany({
    where: estatusFiltro ? { estatus: estatusFiltro as never } : {},
    include: {
      clienta: true,
      producto: { include: { imagenes: { take: 1 } } },
      comprobante: true,
    },
    orderBy: { creadaEn: "desc" },
  });

  // Conteos por estatus para los tabs
  const conteos = await prisma.compra.groupBy({
    by: ["estatus"],
    _count: true,
  });

  const conteoMap = Object.fromEntries(
    conteos.map((c) => [c.estatus, c._count])
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <ShoppingCart className="h-8 w-8 text-primary" />
          Pedidos
        </h1>
        <p className="text-sm text-muted-foreground">
          {compras.length}{" "}
          {compras.length === 1 ? "pedido" : "pedidos"}
          {estatusFiltro && ` (filtrado por ${estatusFiltro})`}
        </p>
      </div>

      <PedidosLista
        compras={compras}
        conteos={conteoMap}
        estatusActivo={estatusFiltro}
      />
    </div>
  );
}
