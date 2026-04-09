import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/getUserContext";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Plus, Package } from "lucide-react";
import { ProductosTable } from "@/components/productos/ProductosTable";

export const metadata = { title: "Productos" };

export default async function ProductosPage() {
  const ctx = await requireRole(["admin", "operadora"]);
  if (!ctx) redirect("/login?redirect=/dashboard/productos");

  const productos = await prisma.producto.findMany({
    include: { imagenes: { orderBy: { orden: "asc" }, take: 1 } },
    orderBy: { creadoEn: "desc" },
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Package className="h-8 w-8 text-primary" />
            Productos
          </h1>
          <p className="text-sm text-muted-foreground">
            {productos.length}{" "}
            {productos.length === 1 ? "producto" : "productos"} en el catálogo
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
    </div>
  );
}
