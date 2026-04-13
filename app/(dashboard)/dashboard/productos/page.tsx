import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/getUserContext";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Plus, Package } from "lucide-react";
import { ProductosTable } from "@/components/productos/ProductosTable";
import { Pagination } from "@/components/ui/pagination";

export const metadata = { title: "Productos" };

const PAGE_SIZE = 25;

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const ctx = await requireRole(["admin", "operadora"]);
  if (!ctx) redirect("/login?redirect=/dashboard/productos");

  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);

  const [productos, total] = await Promise.all([
    prisma.producto.findMany({
      include: { imagenes: { orderBy: { orden: "asc" }, take: 1 } },
      orderBy: { creadoEn: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.producto.count(),
  ]);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Package className="h-8 w-8 text-primary" />
            Productos
          </h1>
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? "producto" : "productos"} en el catálogo
          </p>
        </div>

        {ctx.role === "admin" && (
          <Link
            href="/dashboard/productos/nuevo"
            className={buttonVariants({ size: "lg" })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo producto
          </Link>
        )}
      </div>

      <ProductosTable productos={productos} esAdmin={ctx.role === "admin"} />
      <Pagination total={total} pageSize={PAGE_SIZE} currentPage={page} />
    </div>
  );
}
