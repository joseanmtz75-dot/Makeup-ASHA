import { redirect, notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/getUserContext";
import { prisma } from "@/lib/prisma";
import { ProductoForm } from "@/components/productos/ProductoForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Editar producto" };

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireRole(["admin"]);
  if (!ctx) redirect("/login?redirect=/dashboard/productos");

  const { id } = await params;

  const producto = await prisma.producto.findUnique({
    where: { id },
    include: { imagenes: { orderBy: { orden: "asc" } } },
  });

  if (!producto) notFound();

  return (
    <div className="container mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <Link
          href="/dashboard/productos"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a productos
        </Link>
        <h1 className="text-3xl font-bold">Editar producto</h1>
        <p className="text-sm text-muted-foreground">{producto.nombre}</p>
      </div>

      <ProductoForm modo="editar" producto={producto} />
    </div>
  );
}
