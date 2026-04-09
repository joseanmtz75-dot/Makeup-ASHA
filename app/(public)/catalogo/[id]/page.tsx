import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductoDetalle } from "@/components/publico/ProductoDetalle";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const producto = await prisma.producto.findFirst({
    where: { id, activo: true },
    select: { nombre: true, descripcion: true },
  });

  if (!producto) return { title: "Producto no encontrado" };

  return {
    title: producto.nombre,
    description: producto.descripcion?.slice(0, 160) ?? undefined,
  };
}

export const dynamic = "force-dynamic";

export default async function DetalleProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const producto = await prisma.producto.findFirst({
    where: { id, activo: true },
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      precio: true,
      stock: true,
      categoria: true,
      imagenes: {
        select: { url: true, orden: true },
        orderBy: { orden: "asc" },
      },
    },
  });

  if (!producto) notFound();

  return <ProductoDetalle producto={producto} />;
}
